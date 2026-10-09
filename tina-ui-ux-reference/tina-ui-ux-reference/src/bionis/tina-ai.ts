import type { TextGenerationPipelineType } from '@huggingface/transformers'
import type { Project, Requirement, Milestone, ProjectMessage } from './workspace'

let generatorPromise: Promise<TextGenerationPipelineType> | undefined

async function getGenerator(): Promise<TextGenerationPipelineType> {
  if (!generatorPromise) {
    generatorPromise = import('@huggingface/transformers').then(({ env, pipeline }) => {
      const createTextGenerator = pipeline as (
        task: 'text-generation',
        model: string,
        options: { device: 'wasm'; dtype: 'q8'; model_file_name: 'model' },
      ) => Promise<TextGenerationPipelineType>
      env.allowLocalModels = true
      env.allowRemoteModels = false
      env.localModelPath = `${window.location.origin}/`
      return createTextGenerator('text-generation', 'tina-onnx-model', {
        device: 'wasm',
        dtype: 'q8',
        model_file_name: 'model',
      })
    })
  }

  return generatorPromise
}

export async function askTina({
  project,
  requirements,
  milestones,
  messages,
  prompt,
}: {
  project: Project
  requirements: Requirement[]
  milestones: Milestone[]
  messages: ProjectMessage[]
  prompt: string
}): Promise<string> {
  const context = [
    `Project: ${project.title}`,
    project.summary && `Brief: ${project.summary}`,
    project.tech_stack.length > 0 && `Tech stack: ${project.tech_stack.join(', ')}`,
    `Requirements: ${requirements.map((item) => `${item.description} (${item.status})`).join('; ') || 'none yet'}`,
    `Milestones: ${milestones.map((item) => `${item.title} (${item.status}, ${item.progress}% complete)`).join('; ') || 'none yet'}`,
    `Recent conversation:\n${messages.slice(-6).map((item) => `${item.role === 'assistant' ? 'Tina' : 'Student'}: ${item.content}`).join('\n')}`,
  ].filter(Boolean).join('\n')
  const input = `<|im_start|>system\nYou are Tina, a supportive but rigorous capstone project panelist. Ground answers in the project context, be concise, ask one useful follow-up question, and say when the brief does not contain enough information.\nProject context:\n${context}<|im_end|>\n<|im_start|>user\n${prompt}<|im_end|>\n<|im_start|>assistant\n`

  try {
    const generator = await getGenerator()
    const result = await generator(input, {
      max_new_tokens: 180,
      do_sample: true,
      temperature: 0.7,
      top_p: 0.85,
      repetition_penalty: 1.1,
      return_full_text: false,
    })
    const first = Array.isArray(result[0]) ? result[0][0] : result[0]
    const answer = first?.generated_text
    const text = typeof answer === 'string' ? answer : answer?.map((message) => message.content).join('\n')
    const cleaned = text?.trim().replace(/<\|im_end\|>[\s\S]*$/, '').trim()

    if (!cleaned) {
      throw new Error('Tina returned an empty response. Please try again.')
    }

    return cleaned
  } catch (error) {
    generatorPromise = undefined
    throw new Error(
      error instanceof Error
        ? `Tina could not load or run the local model: ${error.message}`
        : 'Tina could not load or run the local model.',
    )
  }
}

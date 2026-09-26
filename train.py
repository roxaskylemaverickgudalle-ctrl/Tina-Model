import os
import sys

try:
    import torch
    from datasets import load_dataset
    from transformers import AutoTokenizer, AutoModelForCausalLM
    from peft import LoraConfig
    from trl import SFTTrainer, SFTConfig
except ModuleNotFoundError as exc:
    raise SystemExit(
        "Missing required dependency: "
        f"{exc.name}. Install the project requirements in the venv first: "
        "./venv/Scripts/python.exe -m pip install torch transformers datasets peft trl accelerate sentencepiece"
    ) from exc


MODEL_ID = "Qwen/Qwen1.5-0.5B-Chat"
OUTPUT_DIR = "./fine_tuned_tina"


def main():
    device = "cuda" if torch.cuda.is_available() else "cpu"
    dtype = torch.float16 if device == "cuda" else torch.float32
    device_map = "auto" if device == "cuda" else None

    print(f"Using device: {device}")

    # 1. Base Configuration
    print("Loading model and tokenizer...")
    tokenizer = AutoTokenizer.from_pretrained(MODEL_ID, trust_remote_code=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    model = AutoModelForCausalLM.from_pretrained(
        MODEL_ID,
        dtype=dtype,
        device_map=device_map,
        trust_remote_code=True,
    )

    # 2. Configure LoRA for Efficient Fine-Tuning
    peft_config = LoraConfig(
        r=8,
        lora_alpha=16,
        target_modules=["q_proj", "v_proj"],
        lora_dropout=0.05,
        bias="none",
        task_type="CAUSAL_LM",
    )

    # 3. Load Dataset
    dataset = load_dataset("json", data_files="dataset.jsonl")

    # 4. Define Training Arguments
    training_args = SFTConfig(
        output_dir=OUTPUT_DIR,
        per_device_train_batch_size=2,
        gradient_accumulation_steps=4,
        learning_rate=2e-4,
        num_train_epochs=3,
        logging_steps=5,
        fp16=(device == "cuda"),
        bf16=False,
        use_cpu=(device == "cpu"),
        save_strategy="epoch",
        save_total_limit=2,
        report_to="none",
        dataset_text_field="text",
        max_length=256,
        gradient_checkpointing=True,
    )

    # 5. Initialize Trainer
    trainer = SFTTrainer(
        model=model,
        train_dataset=dataset["train"],
        peft_config=peft_config,
        processing_class=tokenizer,
        args=training_args,
    )

    # 6. Execute Training & Save Model
    print("Starting training process...")
    trainer.train()

    print("Saving fine-tuned model...")
    trainer.model.save_pretrained(OUTPUT_DIR)
    tokenizer.save_pretrained(OUTPUT_DIR)

    print(f"Training complete! Fine-tuned weights saved to {OUTPUT_DIR}")


if __name__ == "__main__":
    main()

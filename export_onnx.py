import os
import sys

try:
    import torch
    from peft import PeftModel
    from transformers import AutoTokenizer, AutoModelForCausalLM
    from optimum.onnxruntime import ORTModelForCausalLM
except ModuleNotFoundError as exc:
    raise SystemExit(
        "Missing required dependency: "
        f"{exc.name}. Install it with: "
        "./venv/Scripts/python.exe -m pip install optimum[onnxruntime]"
    ) from exc

BASE_MODEL_ID = "Qwen/Qwen1.5-0.5B-Chat"
LORA_PATH = "./fine_tuned_tina"
MERGED_PATH = "./merged_tina"
SAVE_DIR = "./tina-onnx-model"


def main():
    print("1. Loading base model and LoRA adapter...")
    tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL_ID, trust_remote_code=True)
    base_model = AutoModelForCausalLM.from_pretrained(
        BASE_MODEL_ID,
        dtype=torch.float32,
        trust_remote_code=True,
    )

    print("2. Merging weights...")
    model = PeftModel.from_pretrained(base_model, LORA_PATH)
    model = model.merge_and_unload()

    print("3. Saving temporary merged model...")
    model.save_pretrained(MERGED_PATH)
    tokenizer.save_pretrained(MERGED_PATH)

    print("4. Exporting merged model to ONNX format...")
    onnx_model = ORTModelForCausalLM.from_pretrained(MERGED_PATH, export=True)
    onnx_model.save_pretrained(SAVE_DIR)
    tokenizer.save_pretrained(SAVE_DIR)

    print(f"✅ Success! Your browser-ready ONNX model is saved to: {SAVE_DIR}")


if __name__ == "__main__":
    main()

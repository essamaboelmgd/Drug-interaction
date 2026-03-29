"""Prompt templates for drug interaction queries sent to the Gemini API."""


DRUG_INTERACTION_PROMPT = """
You are an expert clinical pharmacologist. Analyze the potential interaction between the following two drugs:

Drug 1: {drug_1}
Drug 2: {drug_2}

Provide a structured JSON response with the following fields:
{{
  "drug_1": "{drug_1}",
  "drug_2": "{drug_2}",
  "interaction_found": true/false,
  "severity": "none" | "mild" | "moderate" | "severe" | "contraindicated",
  "summary": "Brief one-paragraph summary of the interaction",
  "mechanism": "How these drugs interact pharmacologically",
  "side_effects": ["list of potential side effects when taken together"],
  "risks": ["list of specific risks"],
  "poisoning_risk": {{
    "exists": true/false,
    "description": "Details about potential toxicity or poisoning"
  }},
  "recommendations": ["list of clinical recommendations"],
  "disclaimer": "This is AI-generated information for educational purposes only. Always consult a healthcare professional."
}}

IMPORTANT: Respond ONLY with valid JSON. No markdown, no explanation outside the JSON.
"""


def build_interaction_prompt(drug_1: str, drug_2: str) -> str:
    """Render the interaction prompt with the two drug names substituted in."""
    return DRUG_INTERACTION_PROMPT.format(drug_1=drug_1, drug_2=drug_2)

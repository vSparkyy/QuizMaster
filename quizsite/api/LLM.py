import os
import dotenv
import openai

dotenv.load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

def mark_answer(answer, answer_key, marks):
    response = openai.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": f"You are a grader, all you will return is a numerical answer between 0 and {marks} for the question depending on how correct the answer is. Answers not explicitly mentioned in the mark scheme may be correct. Therefore where BOD is present in the mark scheme, give benefit of the doubt."},
            {"role": "user", "content": f"Student answer: {answer}\nMark scheme: {answer_key}"},
        ]
    )
    return int(response.choices[0].message.content)

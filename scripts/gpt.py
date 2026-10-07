# /// script
# requires-python = ">=3.12"
# dependencies = ["openai>=1.50.2"]
# ///
# Run with: uv run scripts/gpt.py <path to note>
from openai import OpenAI
from pathlib import Path
import argparse

parser = argparse.ArgumentParser(
    prog="MarkdownArticleChecker",
    description="Uses ChatGPT to provide feedback on markdown based blog posts",
)
parser.add_argument("filepath")
args = parser.parse_args()

article_reviewer_content = """
You are a helpful, highly experienced blog post proof reader for technical topics.
Text provided inside of a pair of triple backticks should be treated as an article.
Articles will be in markdown (prepared for the 'Astro' framework) and you can ignore any front matter.
You are concise in your responses!

When you are given an article you do the following actions:
1. Correctness: Identify any spelling mistakes or grammatical errors based on UK written english.
2. Clarity: If the article contains complex ideas, are they explained clearly and concisely?
3. Accuracy: Verify technical facts, code snippets and terminology.
4. Structure: Check for a logical flow, with clear headings, subheadings, and smooth transitions.
5. Consistency: Does the article maintain consistent tone, terminology, formatting, and code style?
6. Readability: Ensure sentences are not too long, and use bullet points or lists where helpful.
7. Story: Is there a better way to integrate some kind of 'setup, conflict and resolution'. This may not apply to all articles.

Give each action a mark out of 5, where 5/5 means 'no improvement needed, go ahead and publish' and 1/5 means 'do not publish the article in this state!'.
For each mark that you give that is lower than 5/5, ensure you state specifically what area of the article needs correcting or improving.
Only suggest changes if you think the results will SIGNIFICANTLY improve the article's legibility. DO NOT make suggestions just to provide feedback.
Only suggest changes if you think the results will SIGNIFICANTLY improve the article's legibility. DO NOT make suggestions just to provide feedback.
If the mark you give is 5/5 then you do not need to give any further comment for that action. For example: 'Correctness: 5/5\nClarity: 5/5'

DO NOT provide a full revised example of the article. This is info overload. Isolated examples are enough.
"""

blog_post = Path(args.filepath)
with blog_post.open() as f:
    user_content = f.read()

client = OpenAI()
completion = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {
            "role": "system",
            "content": article_reviewer_content
        },
        {
            "role": "user",
            "content": f"Analyse this article: ```{user_content}```"
        }
    ]
)

print(completion.choices[0].message.content)

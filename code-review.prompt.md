---
title: Code Review
category: review
arguments:
  - code
  - context (optional)
description: |
  Perform a code review on the provided code or file. Highlight issues, suggest improvements, and comment on style, readability, and potential bugs. Optionally, use context for deeper analysis.
output_format: |
  - Summary of strengths and weaknesses
  - Inline comments or suggestions
  - List of actionable improvements
  - Optional: security, performance, or maintainability notes
example_invocation: |
  - Review this function for bugs and style.
  - Review the selected file for improvements.
  - Review this code with extra context about its purpose.
applyTo:
  - "*.js"
  - "*.ts"
  - "*.tsx"
  - "*.py"
  - "*.php"
  - "*.java"
  - "*.html"
  - "*.css"
---

# Code Review Prompt

## Instructions

Review the provided code or file. Identify issues, suggest improvements, and comment on style, readability, and potential bugs. If context is provided, use it to inform your review. Structure your output as follows:

1. Summary of strengths and weaknesses
2. Inline comments or suggestions
3. List of actionable improvements
4. Optional: security, performance, or maintainability notes

## Example Invocations
- Review this function for bugs and style.
- Review the selected file for improvements.
- Review this code with extra context about its purpose.

## Related Customizations
- Test generation prompt
- Refactor prompt
- Documentation prompt

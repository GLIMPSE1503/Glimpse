# Glimpse Database Design

## Users

Stores user information.

Fields:
- id
- name
- username
- email
- avatar_url
- created_at


## Glimpses

A memory shared by a user.

Fields:
- id
- user_id
- image_url
- caption
- created_at


## Reactions

User reactions on Glimpses.

Fields:
- id
- user_id
- glimpse_id
- reaction_type
- created_at


## Comments

Comments on Glimpses.

Fields:
- id
- user_id
- glimpse_id
- content
- created_at


## Monthly Memories

Generated monthly collage.

Fields:
- id
- user_id
- month
- year
- collage_url
- created_at

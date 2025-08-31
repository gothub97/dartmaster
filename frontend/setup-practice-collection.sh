#!/bin/bash

# Appwrite configuration
PROJECT_ID="68b3e60000396a1e87ce"
DATABASE_ID="68b3e681003b38c7b892"
API_KEY="standard_f5f7cf13f87c19e49f079501797feb955c4a4797ee1a8636491b623bcc978b96e3f29c7e89e5e009bb0e69fe90c68d87f37e69b5b90f1bc74e86c7e7f0e3949c2f3e996fdb968c67a982f67e4cc7c5e92b456797e37f4ac2e33e44c93b5e87fe088bc0c0e18fdc7dcf96b0ebfbb4a965f5bb039e9e4a14e31e64ccc4ae89ad8"
ENDPOINT="https://cloud.appwrite.io/v1"

# Create practice_sessions collection
echo "Creating practice_sessions collection..."
curl -X POST "$ENDPOINT/databases/$DATABASE_ID/collections" \
  -H "Content-Type: application/json" \
  -H "X-Appwrite-Project: $PROJECT_ID" \
  -H "X-Appwrite-Key: $API_KEY" \
  -d '{
    "collectionId": "practice_sessions",
    "name": "Practice Sessions",
    "permissions": ["read(\"any\")", "write(\"users\")", "delete(\"users\")", "update(\"users\")"],
    "documentSecurity": true
  }'

echo -e "\n\nCreating attributes for practice_sessions collection..."

# userId attribute
curl -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/practice_sessions/attributes/string" \
  -H "Content-Type: application/json" \
  -H "X-Appwrite-Project: $PROJECT_ID" \
  -H "X-Appwrite-Key: $API_KEY" \
  -d '{
    "key": "userId",
    "size": 255,
    "required": true
  }'

# mode attribute
curl -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/practice_sessions/attributes/string" \
  -H "Content-Type: application/json" \
  -H "X-Appwrite-Project: $PROJECT_ID" \
  -H "X-Appwrite-Key: $API_KEY" \
  -d '{
    "key": "mode",
    "size": 50,
    "required": true
  }'

# settings attribute (JSON string)
curl -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/practice_sessions/attributes/string" \
  -H "Content-Type: application/json" \
  -H "X-Appwrite-Project: $PROJECT_ID" \
  -H "X-Appwrite-Key: $API_KEY" \
  -d '{
    "key": "settings",
    "size": 5000,
    "required": false
  }'

# throws attribute (JSON string)
curl -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/practice_sessions/attributes/string" \
  -H "Content-Type: application/json" \
  -H "X-Appwrite-Project: $PROJECT_ID" \
  -H "X-Appwrite-Key: $API_KEY" \
  -d '{
    "key": "throws",
    "size": 50000,
    "required": false
  }'

# stats attribute (JSON string)
curl -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/practice_sessions/attributes/string" \
  -H "Content-Type: application/json" \
  -H "X-Appwrite-Project: $PROJECT_ID" \
  -H "X-Appwrite-Key: $API_KEY" \
  -d '{
    "key": "stats",
    "size": 5000,
    "required": false
  }'

# startedAt attribute
curl -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/practice_sessions/attributes/datetime" \
  -H "Content-Type: application/json" \
  -H "X-Appwrite-Project: $PROJECT_ID" \
  -H "X-Appwrite-Key: $API_KEY" \
  -d '{
    "key": "startedAt",
    "required": true
  }'

# endedAt attribute
curl -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/practice_sessions/attributes/datetime" \
  -H "Content-Type: application/json" \
  -H "X-Appwrite-Project: $PROJECT_ID" \
  -H "X-Appwrite-Key: $API_KEY" \
  -d '{
    "key": "endedAt",
    "required": false
  }'

# completed attribute
curl -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/practice_sessions/attributes/boolean" \
  -H "Content-Type: application/json" \
  -H "X-Appwrite-Project: $PROJECT_ID" \
  -H "X-Appwrite-Key: $API_KEY" \
  -d '{
    "key": "completed",
    "required": false,
    "default": false
  }'

echo -e "\n\nWaiting for attributes to be created..."
sleep 5

# Create indexes
echo -e "\n\nCreating indexes..."

# Index on userId for faster queries
curl -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/practice_sessions/indexes" \
  -H "Content-Type: application/json" \
  -H "X-Appwrite-Project: $PROJECT_ID" \
  -H "X-Appwrite-Key: $API_KEY" \
  -d '{
    "key": "userId_index",
    "type": "key",
    "attributes": ["userId"],
    "orders": ["ASC"]
  }'

# Index on mode
curl -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/practice_sessions/indexes" \
  -H "Content-Type: application/json" \
  -H "X-Appwrite-Project: $PROJECT_ID" \
  -H "X-Appwrite-Key: $API_KEY" \
  -d '{
    "key": "mode_index",
    "type": "key",
    "attributes": ["mode"],
    "orders": ["ASC"]
  }'

# Index on startedAt for sorting
curl -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/practice_sessions/indexes" \
  -H "Content-Type: application/json" \
  -H "X-Appwrite-Project: $PROJECT_ID" \
  -H "X-Appwrite-Key: $API_KEY" \
  -d '{
    "key": "startedAt_index",
    "type": "key",
    "attributes": ["startedAt"],
    "orders": ["DESC"]
  }'

echo -e "\n\nPractice sessions collection setup complete!"
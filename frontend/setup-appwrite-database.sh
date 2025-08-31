#!/bin/bash

# Appwrite Database Setup Script for DartMaster Application
# Project ID: 68b40f89000c10f4c303

set -e  # Exit on any error

echo "🎯 Setting up DartMaster Appwrite Database Structure..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Database ID
DATABASE_ID="dartmaster"

echo -e "${BLUE}📊 Creating database: ${DATABASE_ID}${NC}"

# Create database
appwrite databases create \
    --database-id "$DATABASE_ID" \
    --name "DartMaster Database" || {
    echo -e "${YELLOW}⚠️  Database might already exist, continuing...${NC}"
}

echo -e "${GREEN}✅ Database created/verified${NC}"

# Collection IDs
GAMES_COLLECTION_ID="games"
MATCHES_COLLECTION_ID="matches"
STATISTICS_COLLECTION_ID="statistics"

echo -e "${BLUE}🎮 Creating Games Collection${NC}"

# Create Games Collection
appwrite databases create-collection \
    --database-id "$DATABASE_ID" \
    --collection-id "$GAMES_COLLECTION_ID" \
    --name "Games" \
    --permissions 'read("any")' 'create("users")' 'update("users")' 'delete("users")' || {
    echo -e "${YELLOW}⚠️  Games collection might already exist, continuing...${NC}"
}

# Games Collection Attributes
echo -e "${BLUE}📝 Adding attributes to Games collection...${NC}"

# User ID who created the game
appwrite databases create-string-attribute \
    --database-id "$DATABASE_ID" \
    --collection-id "$GAMES_COLLECTION_ID" \
    --key "userId" \
    --size 36 \
    --required true || echo "userId attribute exists"

# Game mode (501, 301, cricket, etc.)
appwrite databases create-string-attribute \
    --database-id "$DATABASE_ID" \
    --collection-id "$GAMES_COLLECTION_ID" \
    --key "mode" \
    --size 50 \
    --required true || echo "mode attribute exists"

# Number of players
appwrite databases create-integer-attribute \
    --database-id "$DATABASE_ID" \
    --collection-id "$GAMES_COLLECTION_ID" \
    --key "playerCount" \
    --required true \
    --min 1 \
    --max 8 || echo "playerCount attribute exists"

# Player names array
appwrite databases create-string-attribute \
    --database-id "$DATABASE_ID" \
    --collection-id "$GAMES_COLLECTION_ID" \
    --key "players" \
    --size 1000 \
    --required true \
    --array true || echo "players attribute exists"

# Winner information
appwrite databases create-string-attribute \
    --database-id "$DATABASE_ID" \
    --collection-id "$GAMES_COLLECTION_ID" \
    --key "winner" \
    --size 100 \
    --required false || echo "winner attribute exists"

# Game status (active, completed, cancelled)
appwrite databases create-string-attribute \
    --database-id "$DATABASE_ID" \
    --collection-id "$GAMES_COLLECTION_ID" \
    --key "status" \
    --size 20 \
    --required true \
    --default "active" || echo "status attribute exists"

# Game started timestamp
appwrite databases create-datetime-attribute \
    --database-id "$DATABASE_ID" \
    --collection-id "$GAMES_COLLECTION_ID" \
    --key "startedAt" \
    --required true || echo "startedAt attribute exists"

# Game finished timestamp
appwrite databases create-datetime-attribute \
    --database-id "$DATABASE_ID" \
    --collection-id "$GAMES_COLLECTION_ID" \
    --key "finishedAt" \
    --required false || echo "finishedAt attribute exists"

# Total turns taken
appwrite databases create-integer-attribute \
    --database-id "$DATABASE_ID" \
    --collection-id "$GAMES_COLLECTION_ID" \
    --key "totalTurns" \
    --required false \
    --min 0 || echo "totalTurns attribute exists"

# Game statistics (scores, throws, etc.) as JSON
appwrite databases create-string-attribute \
    --database-id "$DATABASE_ID" \
    --collection-id "$GAMES_COLLECTION_ID" \
    --key "gameData" \
    --size 10000 \
    --required false || echo "gameData attribute exists"

# Duration in seconds
appwrite databases create-integer-attribute \
    --database-id "$DATABASE_ID" \
    --collection-id "$GAMES_COLLECTION_ID" \
    --key "durationSeconds" \
    --required false \
    --min 0 || echo "durationSeconds attribute exists"

echo -e "${GREEN}✅ Games collection setup complete${NC}"

echo -e "${BLUE}🏆 Creating Matches Collection${NC}"

# Create Matches Collection (for tournaments/leagues)
appwrite databases create-collection \
    --database-id "$DATABASE_ID" \
    --collection-id "$MATCHES_COLLECTION_ID" \
    --name "Matches" \
    --permissions 'read("any")' 'create("users")' 'update("users")' 'delete("users")' || {
    echo -e "${YELLOW}⚠️  Matches collection might already exist, continuing...${NC}"
}

# Matches Collection Attributes
echo -e "${BLUE}📝 Adding attributes to Matches collection...${NC}"

# Tournament/League ID
appwrite databases create-string-attribute \
    --database-id "$DATABASE_ID" \
    --collection-id "$MATCHES_COLLECTION_ID" \
    --key "tournamentId" \
    --size 36 \
    --required false || echo "tournamentId attribute exists"

# Player 1 ID
appwrite databases create-string-attribute \
    --database-id "$DATABASE_ID" \
    --collection-id "$MATCHES_COLLECTION_ID" \
    --key "player1Id" \
    --size 36 \
    --required true || echo "player1Id attribute exists"

# Player 2 ID
appwrite databases create-string-attribute \
    --database-id "$DATABASE_ID" \
    --collection-id "$MATCHES_COLLECTION_ID" \
    --key "player2Id" \
    --size 36 \
    --required true || echo "player2Id attribute exists"

# Player 1 Name
appwrite databases create-string-attribute \
    --database-id "$DATABASE_ID" \
    --collection-id "$MATCHES_COLLECTION_ID" \
    --key "player1Name" \
    --size 100 \
    --required true || echo "player1Name attribute exists"

# Player 2 Name
appwrite databases create-string-attribute \
    --database-id "$DATABASE_ID" \
    --collection-id "$MATCHES_COLLECTION_ID" \
    --key "player2Name" \
    --size 100 \
    --required true || echo "player2Name attribute exists"

# Match status (scheduled, in_progress, completed, cancelled)
appwrite databases create-string-attribute \
    --database-id "$DATABASE_ID" \
    --collection-id "$MATCHES_COLLECTION_ID" \
    --key "status" \
    --size 20 \
    --required true \
    --default "scheduled" || echo "status attribute exists"

# Winner ID
appwrite databases create-string-attribute \
    --database-id "$DATABASE_ID" \
    --collection-id "$MATCHES_COLLECTION_ID" \
    --key "winnerId" \
    --size 36 \
    --required false || echo "winnerId attribute exists"

# Player 1 Score
appwrite databases create-integer-attribute \
    --database-id "$DATABASE_ID" \
    --collection-id "$MATCHES_COLLECTION_ID" \
    --key "player1Score" \
    --required false \
    --min 0 || echo "player1Score attribute exists"

# Player 2 Score
appwrite databases create-integer-attribute \
    --database-id "$DATABASE_ID" \
    --collection-id "$MATCHES_COLLECTION_ID" \
    --key "player2Score" \
    --required false \
    --min 0 || echo "player2Score attribute exists"

# Scheduled time
appwrite databases create-datetime-attribute \
    --database-id "$DATABASE_ID" \
    --collection-id "$MATCHES_COLLECTION_ID" \
    --key "scheduledAt" \
    --required false || echo "scheduledAt attribute exists"

# Started time
appwrite databases create-datetime-attribute \
    --database-id "$DATABASE_ID" \
    --collection-id "$MATCHES_COLLECTION_ID" \
    --key "startedAt" \
    --required false || echo "startedAt attribute exists"

# Completed time
appwrite databases create-datetime-attribute \
    --database-id "$DATABASE_ID" \
    --collection-id "$MATCHES_COLLECTION_ID" \
    --key "completedAt" \
    --required false || echo "completedAt attribute exists"

# Game ID reference
appwrite databases create-string-attribute \
    --database-id "$DATABASE_ID" \
    --collection-id "$MATCHES_COLLECTION_ID" \
    --key "gameId" \
    --size 36 \
    --required false || echo "gameId attribute exists"

echo -e "${GREEN}✅ Matches collection setup complete${NC}"

echo -e "${BLUE}📈 Creating Statistics Collection${NC}"

# Create Statistics Collection
appwrite databases create-collection \
    --database-id "$DATABASE_ID" \
    --collection-id "$STATISTICS_COLLECTION_ID" \
    --name "Statistics" \
    --permissions 'read("any")' 'create("users")' 'update("users")' 'delete("users")' || {
    echo -e "${YELLOW}⚠️  Statistics collection might already exist, continuing...${NC}"
}

# Statistics Collection Attributes
echo -e "${BLUE}📝 Adding attributes to Statistics collection...${NC}"

# User ID
appwrite databases create-string-attribute \
    --database-id "$DATABASE_ID" \
    --collection-id "$STATISTICS_COLLECTION_ID" \
    --key "userId" \
    --size 36 \
    --required true || echo "userId attribute exists"

# Player name for easy querying
appwrite databases create-string-attribute \
    --database-id "$DATABASE_ID" \
    --collection-id "$STATISTICS_COLLECTION_ID" \
    --key "playerName" \
    --size 100 \
    --required true || echo "playerName attribute exists"

# Total games played
appwrite databases create-integer-attribute \
    --database-id "$DATABASE_ID" \
    --collection-id "$STATISTICS_COLLECTION_ID" \
    --key "gamesPlayed" \
    --required true \
    --min 0 \
    --default 0 || echo "gamesPlayed attribute exists"

# Games won
appwrite databases create-integer-attribute \
    --database-id "$DATABASE_ID" \
    --collection-id "$STATISTICS_COLLECTION_ID" \
    --key "gamesWon" \
    --required true \
    --min 0 \
    --default 0 || echo "gamesWon attribute exists"

# Win percentage
appwrite databases create-float-attribute \
    --database-id "$DATABASE_ID" \
    --collection-id "$STATISTICS_COLLECTION_ID" \
    --key "winPercentage" \
    --required true \
    --min 0.0 \
    --max 100.0 \
    --default 0.0 || echo "winPercentage attribute exists"

# Average score
appwrite databases create-float-attribute \
    --database-id "$DATABASE_ID" \
    --collection-id "$STATISTICS_COLLECTION_ID" \
    --key "averageScore" \
    --required false \
    --min 0.0 || echo "averageScore attribute exists"

# Best finish (lowest remaining score)
appwrite databases create-integer-attribute \
    --database-id "$DATABASE_ID" \
    --collection-id "$STATISTICS_COLLECTION_ID" \
    --key "bestFinish" \
    --required false \
    --min 0 || echo "bestFinish attribute exists"

# Total darts thrown
appwrite databases create-integer-attribute \
    --database-id "$DATABASE_ID" \
    --collection-id "$STATISTICS_COLLECTION_ID" \
    --key "totalDarts" \
    --required true \
    --min 0 \
    --default 0 || echo "totalDarts attribute exists"

# Number of 180s scored
appwrite databases create-integer-attribute \
    --database-id "$DATABASE_ID" \
    --collection-id "$STATISTICS_COLLECTION_ID" \
    --key "total180s" \
    --required true \
    --min 0 \
    --default 0 || echo "total180s attribute exists"

# Number of checkout finishes
appwrite databases create-integer-attribute \
    --database-id "$DATABASE_ID" \
    --collection-id "$STATISTICS_COLLECTION_ID" \
    --key "totalCheckouts" \
    --required true \
    --min 0 \
    --default 0 || echo "totalCheckouts attribute exists"

# Favorite game mode
appwrite databases create-string-attribute \
    --database-id "$DATABASE_ID" \
    --collection-id "$STATISTICS_COLLECTION_ID" \
    --key "favoriteMode" \
    --size 50 \
    --required false || echo "favoriteMode attribute exists"

# Last updated timestamp
appwrite databases create-datetime-attribute \
    --database-id "$DATABASE_ID" \
    --collection-id "$STATISTICS_COLLECTION_ID" \
    --key "lastUpdated" \
    --required true || echo "lastUpdated attribute exists"

echo -e "${GREEN}✅ Statistics collection setup complete${NC}"

echo -e "${BLUE}🔍 Creating database indexes for optimal performance...${NC}"

# Games Collection Indexes
appwrite databases create-index \
    --database-id "$DATABASE_ID" \
    --collection-id "$GAMES_COLLECTION_ID" \
    --key "idx_userId" \
    --type "key" \
    --attributes "userId" || echo "userId index exists"

appwrite databases create-index \
    --database-id "$DATABASE_ID" \
    --collection-id "$GAMES_COLLECTION_ID" \
    --key "idx_status" \
    --type "key" \
    --attributes "status" || echo "status index exists"

appwrite databases create-index \
    --database-id "$DATABASE_ID" \
    --collection-id "$GAMES_COLLECTION_ID" \
    --key "idx_mode" \
    --type "key" \
    --attributes "mode" || echo "mode index exists"

appwrite databases create-index \
    --database-id "$DATABASE_ID" \
    --collection-id "$GAMES_COLLECTION_ID" \
    --key "idx_startedAt" \
    --type "key" \
    --attributes "startedAt" \
    --orders "DESC" || echo "startedAt index exists"

appwrite databases create-index \
    --database-id "$DATABASE_ID" \
    --collection-id "$GAMES_COLLECTION_ID" \
    --key "idx_user_status" \
    --type "key" \
    --attributes "userId" "status" || echo "user_status compound index exists"

# Matches Collection Indexes
appwrite databases create-index \
    --database-id "$DATABASE_ID" \
    --collection-id "$MATCHES_COLLECTION_ID" \
    --key "idx_player1Id" \
    --type "key" \
    --attributes "player1Id" || echo "player1Id index exists"

appwrite databases create-index \
    --database-id "$DATABASE_ID" \
    --collection-id "$MATCHES_COLLECTION_ID" \
    --key "idx_player2Id" \
    --type "key" \
    --attributes "player2Id" || echo "player2Id index exists"

appwrite databases create-index \
    --database-id "$DATABASE_ID" \
    --collection-id "$MATCHES_COLLECTION_ID" \
    --key "idx_tournamentId" \
    --type "key" \
    --attributes "tournamentId" || echo "tournamentId index exists"

appwrite databases create-index \
    --database-id "$DATABASE_ID" \
    --collection-id "$MATCHES_COLLECTION_ID" \
    --key "idx_status" \
    --type "key" \
    --attributes "status" || echo "match status index exists"

appwrite databases create-index \
    --database-id "$DATABASE_ID" \
    --collection-id "$MATCHES_COLLECTION_ID" \
    --key "idx_scheduledAt" \
    --type "key" \
    --attributes "scheduledAt" \
    --orders "ASC" || echo "scheduledAt index exists"

# Statistics Collection Indexes
appwrite databases create-index \
    --database-id "$DATABASE_ID" \
    --collection-id "$STATISTICS_COLLECTION_ID" \
    --key "idx_userId" \
    --type "unique" \
    --attributes "userId" || echo "userId unique index exists"

appwrite databases create-index \
    --database-id "$DATABASE_ID" \
    --collection-id "$STATISTICS_COLLECTION_ID" \
    --key "idx_winPercentage" \
    --type "key" \
    --attributes "winPercentage" \
    --orders "DESC" || echo "winPercentage index exists"

appwrite databases create-index \
    --database-id "$DATABASE_ID" \
    --collection-id "$STATISTICS_COLLECTION_ID" \
    --key "idx_gamesPlayed" \
    --type "key" \
    --attributes "gamesPlayed" \
    --orders "DESC" || echo "gamesPlayed index exists"

appwrite databases create-index \
    --database-id "$DATABASE_ID" \
    --collection-id "$STATISTICS_COLLECTION_ID" \
    --key "idx_total180s" \
    --type "key" \
    --attributes "total180s" \
    --orders "DESC" || echo "total180s index exists"

echo -e "${GREEN}🎉 Database setup complete!${NC}"

echo -e "${BLUE}📋 Summary:${NC}"
echo -e "Database: ${YELLOW}dartmaster${NC}"
echo -e "Collections created:"
echo -e "  • ${GREEN}games${NC} - Game sessions with player data and statistics"
echo -e "  • ${GREEN}matches${NC} - Tournament/league match tracking"  
echo -e "  • ${GREEN}statistics${NC} - Player statistics and analytics"
echo -e ""
echo -e "Indexes created for optimal query performance on:"
echo -e "  • User-based queries"
echo -e "  • Status filtering"
echo -e "  • Date-based sorting"
echo -e "  • Statistics leaderboards"
echo -e ""
echo -e "${GREEN}✅ Your DartMaster database is ready to use!${NC}"
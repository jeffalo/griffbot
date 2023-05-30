# Griffbot
A custom Discord moderation bot for the Griffpatch Discord community.

## Dependencies
griffbot depends on MongoDB database running, configured under `MONGO_URL` in .env.

| key                   | description                                 |
| -------------------   | ------------------------------------------- |
| MONGO_URL             | MongoDB database URI                        |
| DISCORD_TOKEN         | Discord bot token                           |
| DISCORD_ID            | Discord bot ID                              |
| DISCORD_SECRET        | Discord OAuth secret                        |
| GUILD_ID              | ID of Discord guild where bot should run    |
| PINGER_ROLE_ID        | ID of Discord role for muted pingers        |
| VERIFIED_ROLE_ID      | ID of Discord role for verified members     |
| ACTIVE_ROLE_ID        | ID of Discord role for active members       |
| MODERATOR_ROLE_ID     | ID of Discord role for moderators           |
| GENERAL_CHANNEL_ID    | ID of the #general channel                  |
| LOG_CHANNEL_ID        | ID of Discord channel to log in             |
| REPORT_LOG_CHANNEL_ID | ID of Discord channel to log reports in     |
| PROJECT               | Scratch project ID for verification         |
| PROJECT_OWNER         | Owner of verification project               |
| ADMIN_URL             | Frontend interface URL                      |
| MODERATOR_IDS         | Allow-listed moderators                     |

import * as migration_20260826_090000_add_public_content from './20260826_090000_add_public_content'
import * as migration_20260826_150000_add_user_favorites from './20260826_150000_add_user_favorites'
import * as migration_20260827_093000_add_analytics_events from './20260827_093000_add_analytics_events'

export const migrations = [
  {
    up: migration_20260826_090000_add_public_content.up,
    down: migration_20260826_090000_add_public_content.down,
    name: '20260826_090000_add_public_content',
  },
  {
    up: migration_20260826_150000_add_user_favorites.up,
    down: migration_20260826_150000_add_user_favorites.down,
    name: '20260826_150000_add_user_favorites',
  },
  {
    up: migration_20260827_093000_add_analytics_events.up,
    down: migration_20260827_093000_add_analytics_events.down,
    name: '20260827_093000_add_analytics_events',
  },
]

import * as migration_20260826_090000_add_public_content from './20260826_090000_add_public_content'
import * as migration_20260826_150000_add_user_favorites from './20260826_150000_add_user_favorites'
import * as migration_20260827_093000_add_analytics_events from './20260827_093000_add_analytics_events'
import * as migration_20260828_120000_add_two_factor from './20260828_120000_add_two_factor'
import * as migration_20260828_160000_harden_two_factor from './20260828_160000_harden_two_factor'
import * as migration_20260828_180000_add_content_media from './20260828_180000_add_content_media'
import * as migration_20260828_210000_vehicle_only_routes from './20260828_210000_vehicle_only_routes'
import * as migration_20260831_120000_add_user_routes from './20260831_120000_add_user_routes'

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
  {
    up: migration_20260828_120000_add_two_factor.up,
    down: migration_20260828_120000_add_two_factor.down,
    name: '20260828_120000_add_two_factor',
  },
  {
    up: migration_20260828_160000_harden_two_factor.up,
    down: migration_20260828_160000_harden_two_factor.down,
    name: '20260828_160000_harden_two_factor',
  },
  {
    up: migration_20260828_180000_add_content_media.up,
    down: migration_20260828_180000_add_content_media.down,
    name: '20260828_180000_add_content_media',
  },
  {
    up: migration_20260828_210000_vehicle_only_routes.up,
    down: migration_20260828_210000_vehicle_only_routes.down,
    name: '20260828_210000_vehicle_only_routes',
  },
  {
    up: migration_20260831_120000_add_user_routes.up,
    down: migration_20260831_120000_add_user_routes.down,
    name: '20260831_120000_add_user_routes',
  },
]

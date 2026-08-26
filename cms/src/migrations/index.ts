import * as migration_20260826_090000_add_public_content from './20260826_090000_add_public_content'

export const migrations = [
  {
    up: migration_20260826_090000_add_public_content.up,
    down: migration_20260826_090000_add_public_content.down,
    name: '20260826_090000_add_public_content',
  },
]

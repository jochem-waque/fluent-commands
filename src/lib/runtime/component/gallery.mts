/**
 * Copyright (C) 2024-2025  Jochem Waqué
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { MediaGalleryBuilder } from "discord.js"
import type { Gallery } from "../../types/component/gallery.mts"
import type { Media } from "../../types/component/media.mts"

export function gallery(...items: Pick<Media, "builder">[]): Gallery {
  return {
    builder: new MediaGalleryBuilder().addItems(
      items.map((item) => item.builder),
    ),
    id(id) {
      this.builder.setId(id)
      return this
    },
    build() {
      return this.builder.toJSON()
    },
  }
}

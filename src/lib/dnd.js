// Trạng thái kéo thả công việc dùng chung giữa danh sách bên phải, lịch và timeline.
// payload: { id, occ, grab } — occ: ngày bắt đầu của lần xuất hiện đang kéo (null nếu chưa lên lịch),
// grab: số ngày từ đầu lần xuất hiện đến vị trí con trỏ.
let payload = null

export const setDrag = (p, e) => {
  payload = p
  if (e) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', p.id) // Firefox cần dữ liệu để bắt đầu kéo
  }
}
export const getDrag = () => payload
export const clearDrag = () => { payload = null }

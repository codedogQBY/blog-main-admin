<template>
  <div v-if="showEmojiPicker" class="emoji-picker-overlay" @click="$emit('close')">
    <div class="emoji-picker" @click.stop>
      <div class="emoji-grid">
        <span 
          v-for="emoji in commonEmojis" 
          :key="emoji"
          @click="$emit('insertEmoji', emoji)"
          class="emoji-item"
        >
          {{ emoji }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  showEmojiPicker: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'insertEmoji', emoji: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 常用表情
const commonEmojis = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
  '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
  '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
  '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
  '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬',
  '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗',
  '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯',
  '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐',
  '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈',
  '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉',
  '👆', '🖕', '👇', '☝️', '👋', '🤚', '🖐', '✋', '🖖', '👏',
  '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💪', '🦾', '🦿', '🦵',
  '🦶', '👂', '🦻', '👃', '🧠', '🫀', '🫁', '🦷', '🦴', '👀',
  '👁', '👅', '👄', '💋', '🩸', '👶', '🧒', '👦', '👧', '🧑'
]
</script>

<style scoped lang="scss">
/* 表情选择器 */
.emoji-picker-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;

  .emoji-picker {
    background: white;
    border-radius: 12px;
    padding: 20px;
    max-width: 400px;
    max-height: 500px;
    overflow-y: auto;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);

    .emoji-grid {
      display: grid;
      grid-template-columns: repeat(8, 1fr);
      gap: 8px;

      .emoji-item {
        font-size: 24px;
        padding: 8px;
        text-align: center;
        cursor: pointer;
        border-radius: 6px;
        transition: background 0.2s ease;

        &:hover {
          background: #f1f5f9;
        }
      }
    }
  }
}
</style>
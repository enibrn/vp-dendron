<template>
  <div class="vp-doc">
    <table class="vp-table">
      <tbody>
        <tr>
          <td>Created:</td>
          <td>{{ createdDateString }}</td>
        </tr>
        <tr>
          <td>Updated:</td>
          <td>{{ updatedDateString }}</td>
        </tr>
        <tr>
          <td colspan="2">
            <button
              @click="copyPermalink"
              class="permalink-button"
              :class="{ 'copied': showCopiedTooltip }"
            >
              Permalink
              <span v-if="showCopiedTooltip" class="tooltip">Permalink has been copied!</span>
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script
  setup
  lang="ts"
>
import { computed, ref } from 'vue';

const props = defineProps({
  createdTimestamp: {
    type: String,
    required: true
  },
  updatedTimestamp: {
    type: String,
    required: true
  },
  uid: {
    type: String,
    required: true
  }
});

// todo: date based on locale, captions
const locales = 'it-IT';
const options = { day: '2-digit', month: '2-digit', year: 'numeric' } as Intl.DateTimeFormatOptions;
const formatTs = (ts: string | number | Date) => new Date(ts).toLocaleDateString(locales, options);

const createdDateString = computed(() => formatTs(props.createdTimestamp));
const updatedDateString = computed(() => formatTs(props.updatedTimestamp));

// Permalink functionality
const showCopiedTooltip = ref(false);

const copyPermalink = async () => {
  const permalinkUrl = `click.me/${props.uid}`;
  
  try {
    await navigator.clipboard.writeText(permalinkUrl);
    showCopiedTooltip.value = true;
    
    // Hide tooltip after 2 seconds
    setTimeout(() => {
      showCopiedTooltip.value = false;
    }, 2000);
  } catch (err) {
    console.error('Failed to copy permalink: ', err);
  }
};
</script>

<style scoped>
.permalink-button {
  position: relative;
  background: var(--vp-c-brand);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  width: 100%;
  outline: none;
}

.permalink-button:hover {
  background: var(--vp-c-brand-dark);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.permalink-button:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.permalink-button.copied {
  background: var(--vp-c-green);
}

.tooltip {
  position: absolute;
  top: -40px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--vp-c-text-1);
  color: var(--vp-c-bg);
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  z-index: 1000;
  animation: fadeInOut 2s ease;
}

.tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 5px solid transparent;
  border-top-color: var(--vp-c-text-1);
}

@keyframes fadeInOut {
  0% { opacity: 0; transform: translateX(-50%) translateY(-5px); }
  10%, 90% { opacity: 1; transform: translateX(-50%) translateY(0); }
  100% { opacity: 0; transform: translateX(-50%) translateY(-5px); }
}
</style>
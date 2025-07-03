<template>
  <div class="vp-doc">
    <table class="vp-table">
      <tbody>
        <tr>
          <td>Created:</td>
          <td>{{ formatTimestamp(props.createdTimestamp) }}</td>
        </tr>
        <tr v-if="props.createdTimestamp !== props.updatedTimestamp">
          <td>Updated:</td>
          <td>{{ formatTimestamp(props.updatedTimestamp) }}</td>
        </tr>
        <tr>
          <td colspan="2">
            <Permalink :uid="uid" />
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
import Permalink from './Permalink.vue';
import { useDateUtils } from '../composables';

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

const { formatTimestamp } = useDateUtils();
</script>
<template>
  <div>
    <h2>TODO: mermaid</h2>
    <v-btn @click="update">update</v-btn>
    <div id="mermaid" class="mermaid">{{ input }}</div>
  </div>
</template>

<script>
import mermaid from 'mermaid'
import FlowGenerator from '~/plugins/flow.js'
import Converter from '~/plugins/converter.js'
import recipes from '~/assets/recipes.json'
import locales from '~/assets/locales.json'
export default {
  data() {
    return {
      input: ''
    }
  },
  mounted() {
    let flow = new FlowGenerator(Object.values(recipes))
    let result = flow.generate('inserter', 60, true)
    let converter = new Converter(locales)
    let texts = converter.convert(result)
    console.log(texts)
    mermaid.initialize({})
    this.input = texts.join('\n')
  },
  methods: {
    update() {
      this.input = `graph LR\nA --- B[${Date.now()}]`
      mermaid.render('mermaid', this.input)
    }
  }
}
</script>

<style>
</style>

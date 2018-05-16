<template>
  <v-form v-model="valid">
    <v-layout row wrap justify-center align-center>
      <v-flex xs3>
        <v-text-field label="product" :rules="nameRules"></v-text-field>
      </v-flex>
      <v-flex xs3 offset-xs1>
        <v-text-field label="amount/min" :rules="numberRules"></v-text-field>
      </v-flex>
      <v-flex xs2 offset-xs1>
        <v-btn :disabled="!valid" @click="onClickButton">ok</v-btn>
      </v-flex>
      <v-flex xs12>
        <div id="mermaid" class="mermaid">{{ input }}</div>
      </v-flex>
    </v-layout>
  </v-form>
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
      input: '',
      valid: false,
      nameRules: [
        v => !!v || 'required'
      ],
      numberRules: [
        v => !isNaN(v) || 'not a number'
      ]
    }
  },
  mounted() {
    let flow = new FlowGenerator(Object.values(recipes))
    let result = flow.generate('inserter', 60, true)
    let converter = new Converter(locales)
    let texts = converter.convert(result)
    console.log(texts)
    // mermaid.initialize({})
    this.input = texts.join('\n')
    // let container = document.getElementById('mermaid')
    // mermaid.init(null, container)
  },
  methods: {
    onClickButton() {
      console.log(mermaid)
      let flow = new FlowGenerator(Object.values(recipes))
      let result = flow.generate('inserter', 60, true)
      let converter = new Converter(locales)
      let texts = converter.convert(result)
      this.input = texts.join('\n')
      let container = document.getElementById('mermaid')
      mermaid.init(null, container)
      // mermaid.render('mermaid-x', this.input, () => {}, container)
    }
  }
}
</script>

<style>
.mermaid {
  width: 100%;
  text-align: center;
}
.mermaid .node rect {
  /*
  fill: #ececff !important;
  stroke: #ffffff !important;
  stroke-width: 0px !important;
  */
}
.mermaid .edgePath path {
  /*
  stroke: #ffffff !important;
  stroke-width: 1.5px !important;
  */
}
</style>

<template>
  <v-layout row wrap justify-center align-center>
    <v-flex xs3>
      <v-text-field
        label="product"
        :rules="[rules.required]"
        v-model="product"
        ref="product"></v-text-field>
    </v-flex>
    <v-flex xs3 offset-xs1>
      <v-text-field
        label="amount/min"
        :rules="[rules.required, rules.number]"
        v-model.number="amount"
        type="number"
        ref="amount"></v-text-field>
    </v-flex>
    <v-flex xs2 offset-xs1>
      <v-btn @click="onClickButton">ok</v-btn>
    </v-flex>
    <v-flex xs12 v-if="hasDuplicated">
      <v-btn v-for="(value, key) in duplicated" :key="key">{{ key }}</v-btn>
    </v-flex>
    <v-flex xs12>
      <div id="mermaid" class="mermaid">{{ input }}</div>
    </v-flex>
  </v-layout>
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
      product: null,
      amount: null,
      hasDuplicated: false,
      duplicated: null,
      rules: {
        required: (v) => !!v || 'required',
        number: (v) => !isNaN(v) || 'not a number'
      }
    }
  },
  mounted() {
    let container = document.getElementById('mermaid')
    container.setAttribute('data-processed', true)
  },
  methods: {
    onClickButton() {
      if (!this.$refs.product.valid || !this.$refs.amount.valid) {
        return
      }
      let converter = new Converter(locales)
      let parsedProduct
      try {
        parsedProduct = converter.parseResource(this.product)
      } catch (e) {
        this.$refs.product.rules.push((v) => e.message)
        this.$refs.product.validate()
        return
      }
      this.$refs.product.validate()
      let container = document.getElementById('mermaid')

      let flow = new FlowGenerator(Object.values(recipes))
      let duplicated = {}
      let result = flow.generate(parsedProduct, this.amount, true, duplicated)
      this.duplicated = duplicated
      this.hasDuplicated = Object.keys(this.duplicated).length > 0
      console.log(this)
      let code = converter.convert(result).join('\n')
      this.input = code
      container.removeAttribute('data-processed')
      container.innerHTML = code
      mermaid.parse(code)
      mermaid.init(null, container)
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

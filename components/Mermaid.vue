<template>
  <v-layout row wrap justify-center>
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
    <v-flex xs2 offset-xs1 offset-xs2>
      <v-btn @click="onClickOK">ok</v-btn>
    </v-flex>
    <v-flex xs12 v-if="showDuplicated">
      <v-btn
        v-for="(value, key) in duplicated"
        :key="key"
        @click="onClickDuplicated(key)"
        class="no-transform">{{ converter.getResource(key) }}</v-btn>
    </v-flex>
    <v-flex xs12 v-if="showRecipe">
      <v-container fluid grid-list-md>
        <v-layout row wrap>
          <v-flex
            xs3
                 v-for="recipe in duplicated[selectedKey]"
                 :key="recipe.name">
            <v-card>
              <v-card-title>{{ converter.getResource(recipe.name) }}</v-card-title>
              <v-card-text>
                <p v-for="text in recipeText[recipe.name]" :key="text">{{ text }}</p>
              </v-card-text>
              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn icon small @click="onClickAdd(recipe)">
                  <v-icon>add</v-icon>
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-flex>
        </v-layout>
      </v-container>
    </v-flex>
    <v-flex xs10>
      <div id="mermaid" class="mermaid">{{ mermaidCode }}</div>
    </v-flex>
    <v-flex xs2>
      <p>Priority Recipes</p>
      <v-card v-for="priority in priorities" :key="priority.name" >
        <v-card-title>{{ converter.getResource(priority.name) }}</v-card-title>
        <v-card-text>
          <p v-for="text in getRecipeText(priority)" :key="text">{{ text }}</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn icon small @click="onClickRemove(priority)">
            <v-icon>clear</v-icon>
          </v-btn>
        </v-card-actions>
      </v-card>
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
      converter: null,
      flow: null,
      mermaidCode: '',
      product: null,
      amount: null,
      showDuplicated: false,
      duplicated: null,
      selectedKey: null,
      showRecipe: false,
      priorities: [],
      recipeText: {},
      rules: {
        required: v => !!v || 'required',
        number: v => !isNaN(v) || 'not a number'
      }
    }
  },

  mounted() {
    this.converter = new Converter(locales)
    this.flow = new FlowGenerator(Object.values(recipes))
    let container = document.getElementById('mermaid')
    container.setAttribute('data-processed', true)
  },

  methods: {
    onClickOK() {
      // check
      if (!this.$refs.product.valid || !this.$refs.amount.valid) {
        return
      }
      let parsedProduct
      try {
        parsedProduct = this.converter.parseResource(this.product)
      } catch (e) {
        this.$refs.product.rules.push(v => e.message)
        this.$refs.product.validate()
        return
      }
      this.$refs.product.validate()

      // generate flow
      let duplicated = {}
      let priorities = this.priorities.map(recipe => recipe.name)
      let result = this.flow.generate(parsedProduct, this.amount, true, duplicated, priorities)
      this.duplicated = duplicated
      this.showDuplicated = Object.keys(this.duplicated).length > 0

      // convert to mermaid code
      let code = this.converter.convert(result).join('\n')
      this.mermaidCode = code

      // render
      let container = document.getElementById('mermaid')
      container.removeAttribute('data-processed')
      container.innerHTML = code
      mermaid.parse(code)
      mermaid.init(null, container)
    },

    onClickDuplicated(key) {
      this.showRecipe = false
      for (let recipe of this.duplicated[key]) {
        if (!this.recipeText[recipe.name]) {
          this.recipeText[recipe.name] = this.getRecipeText(recipe)
        }
      }
      this.selectedKey = key
      this.showRecipe = true
    },

    onClickAdd(recipe) {
      this.priorities.push(recipe)
      delete this.duplicated[this.selectedKey]
      this.selectedKey = null
      this.showRecipe = false
    },

    onClickRemove(recipe) {
      this.priorities = this.priorities.filter(p => p.name !== recipe.name)
    },

    getRecipeText(recipe) {
      let text = []
      let inText = recipe.ingredients.map(ing => `${this.converter.getResource(ing.name)}(${ing.amount})`)
      text.push(`in: ${inText.join(', ')}`)
      let outText = recipe.products.map(pro => `${this.converter.getResource(pro.name)}(${pro.amount})`)
      text.push(`out: ${outText.join(', ')}`)
      text.push(`time: ${recipe.energy}`)
      return text
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
.mermaid svg {
  filter: drop-shadow(0px 2px 1px rgba(0, 0, 0, .5));
}
.card {
  margin: 4px;
}
.card p {
  margin-bottom: 1px;
}
.card__title {
  padding: 5px 8px 5px 8px;
  font-size: 16px;
}
.card__text {
  padding: 5px 16px 5px 16px;
}
.no-transform {
  text-transform: none !important;
}
</style>

class Converter {
  constructor(locales, sections = null) {
    this.locales = locales
    this.sections = sections
  }

  getResource(key) {
    if (this.sections) {
      for (let section of this.sections) {
        if (key in this.locales[section]) {
          return this.locales[section][key]
        }
      }
    } else {
      for (let values of Object.values(this.locales)) {
        if (key in values) {
          return values[key]
        }
      }
    }
    return key
  }

  parseResource(name) {
    for (let values of Object.values(this.locales)) {
      for (let entry of Object.entries(values)) {
        if (entry[1] === name) {
          return entry[0]
        }
      }
    }
    throw new Error('not found.')
  }

  convert(root) {
    return ['graph TD', ...this.convertRecurse(root)]
  }

  convertRecurse(root, labelPrinted = {}) {
    // 起点が出力済みなら、何も出力しない
    if (root.id in labelPrinted) {
      return []
    }
    labelPrinted[root.id] = true

    let result = []
    let first = true
    for (let srcNode of root.srcNodes) {
      // src
      let srcText
      if (srcNode.node.recipe) {
        // レシピが存在する場合は次の呼び出しでラベル付けされる
        srcText = `${srcNode.id}`
      } else {
        let srcName = this.getResource(srcNode.node.name)
        if (srcNode.node.root) {
          srcText = `${srcNode.id}(${srcName})`
        } else {
          srcText = `${srcNode.id}[${srcName}]`
        }
      }

      // arrow
      let itemLabels = srcNode.items.map(
        item => `${this.getResource(item.name)}: ${item.amount}`
      )
      let arrowText = `"${itemLabels.join(', ')}"`

      // dst
      // 出力先が無い場合は注記する
      let trash = Object.entries(root.trash)
        .filter(entry => entry[1])
        .map(entry => entry[0])
      let trashItems = trash
        .map(item => '*' + this.getResource(item))
        .join('<br>')
      let trashText = trashItems.length ? '<br>' + trashItems : ''
      let dstText
      if (first) {
        if (root.goal) {
          dstText = `${root.id}(${this.getResource(root.name)})`
        } else {
          dstText = `${root.id}[${this.getResource(
            root.recipe.name
          )}<br>&lt ${this.getResource(
            root.recipe.category
          )} &gt<br>${Math.round(root.count * 100) / 100}${trashText}]`
        }
        first = false
      } else {
        dstText = `${root.id}`
      }

      // 結合
      let str = `${srcText} --> |${arrowText}|${dstText}`
      result.push(str)
      if (srcNode.node) {
        result.push(...this.convertRecurse(srcNode.node, labelPrinted))
      }
    }
    return result
  }
}

/*
const printRecipe = recipe => {
  console.log(recipe)
  let obj = {
    name: recipe.name,
    translated_name: getResource(recipe.name),
    category: recipe.category,
    ingredients: [],
    products: [],
    energy: recipe.energy
  }
  for (let ingredient of recipe.ingredients) {
    obj.ingredients.push(getResource(ingredient.name) + ingredient.amount)
  }
  for (let product of recipe.products) {
    obj.products.push(getResource(product.name) + product.amount)
  }
  console.log(obj)
}
*/

export default Converter

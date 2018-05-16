class FlowGenerator {
  constructor(recipes) {
    this.recipes = recipes
    this.ROOT_ITEMS = [
      'steam',
      'wood',
      'water-yellow-waste',
      'gas-compressed-air'
    ]
    this.GLOBAL_ID = 0
  }

  generateId() {
    this.GLOBAL_ID += 1
    return this.GLOBAL_ID.toString().padStart(4, '0')
  }

  searchRecipe(name) {
    let results = this.recipes.filter(recipe => {
      return recipe.products.filter(product => product.name === name).length
    })
    return results
  }

  /*
   * nodeは処理装置を表す
   * node:
   *   id: "$id"
   *   name: "TBD"
   *   recipe: "$recipeName"
   *   machine: "$machineName"
   *   count: $count
   *   srcNodes:
   *     - id: "$nodeId"
   *       items:
   *         - name: "$itemName"
   *           amount: $amount ( n / min )
   *         ...
   *     ...
   *   dstNodes: same as srcNode
   */

  selectRecipe(recipeList, name, priority, duplicated) {
    // 除外
    let filtered = recipeList.filter(recipe => {
      return (
        !recipe.name.endsWith('-barrel') &&
        !recipe.name.startsWith('slag-processing-')
      )
    })
    // 結果が1以下であればリターン
    if (filtered.length <= 1) {
      return filtered[0]
    }
    // priority指定を優先
    for (let recipe of recipeList) {
      if (priority.includes(recipe.name)) {
        return recipe
      }
    }
    // plateは鋳造を優先
    if (name.endsWith('plate')) {
      let subFIltered = filtered.filter(recipe => {
        return recipe.name.startsWith('angels-plate')
      })
      if (subFIltered.length > 0) {
        return subFIltered[0]
      }
    }
    if (filtered.length > 1) {
      duplicated[name] = filtered
    }
    // とりあえず、最初のを採用する
    return filtered[0]
  }

  isRoot(name) {
    return name.endsWith('-ore') || this.ROOT_ITEMS.includes(name)
  }

  /**
   * 再帰的に出力をratio倍にする
   */
  increaseRecurse(node, ratio, memo = {}) {
    if (memo[node.id]) {
      return
    }
    memo[node.id] = true
    // countの更新
    node.count = node.count * ratio
    for (let srcNode of node.srcNodes) {
      // srcNodes[].itemsの更新
      for (let item of srcNode.items) {
        item.amount = item.amount * ratio
      }
      // srcNodes[].nodeの更新
      this.increaseRecurse(srcNode.node, ratio, memo)
    }
  }

  /**
   * nameを出力するセルを作成する。
   * - 既に存在するなら、必要数を再帰的に増加させて、既存のオブジェクトを返す
   * - 存在しない場合、新規に生成してオブジェクトを返す
   * - 子を作成した場合、子のdstNodes設定は親が行う
   */
  searchRecurse(name, amount, duplicated, priority, memo = {}) {
    // memoに存在するかチェック
    if (name in memo) {
      return memo[name]
    }

    // 雛形
    let returnNode = {
      id: this.generateId(),
      name: name,
      srcNodes: [],
      dstNodes: [],
      trash: {},
      recipe: null,
      root: false
    }
    returnNode.trash[name] = false
    memo[name] = returnNode

    // rootノードとして定義されたnameなら、そのままreturn
    if (this.isRoot(name)) {
      returnNode.root = true
      return returnNode
    }

    // レシピ検索
    let recipeList = this.searchRecipe(name)
    if (recipeList.length === 0) {
      returnNode.root = true
      return returnNode
    }

    // レシピ選択
    let recipe = this.selectRecipe(recipeList, name, priority, duplicated)
    if (!recipe) {
      return returnNode
    }

    returnNode.recipe = recipe
    for (let product of recipe.products) {
      if (product.name !== name) {
        // 未使用フラグをtrueに
        returnNode.trash[product.name] = true

        // 副生成物もmemoに登録
        memo[product.name] = returnNode
      }
    }

    // 機械の台数を計算
    let targetProduct = recipe.products.find(product => product.name === name)
    let amountPerMinutes = 60 / recipe.energy * targetProduct.amount
    let rowCount = amount / amountPerMinutes
    // TODO: 台数は整数にする
    // returnNode.count = Math.ceil(rowCount)
    returnNode.count = rowCount

    // 必要素材について、再帰的にnodeを取得し、srcNodesとdstNodesを設定
    for (let ingredient of recipe.ingredients) {
      let needAmount = amount * ingredient.amount / targetProduct.amount
      let ingredientNode = this.searchRecurse(
        ingredient.name,
        needAmount,
        duplicated,
        priority,
        memo
      )

      // srcNodesに含まれていれば、itemsを増やす
      let existNode = returnNode.srcNodes.find(
        node => node.id === ingredientNode.id
      )
      if (existNode) {
        existNode.items.push({
          name: ingredient.name,
          amount: needAmount
        })
      } else {
        // 含まれていなければ、srcNodesに追加
        let srcNode = {
          id: ingredientNode.id,
          node: ingredientNode,
          items: [
            {
              name: ingredient.name,
              amount: needAmount
            }
          ]
        }
        returnNode.srcNodes.push(srcNode)
      }
      let dstNode = {
        id: returnNode.id,
        node: returnNode,
        items: [
          {
            name: ingredient.name,
            amount: needAmount
          }
        ]
      }
      ingredientNode.dstNodes.push(dstNode)
    }

    return returnNode
  }

  generate(name, amount, goal, duplicated = {}, priority = []) {
    if (goal) {
      let result = this.searchRecurse(name, amount, duplicated, priority)
      let rootNode = {
        id: this.generateId(),
        name: name,
        srcNodes: [
          {
            id: result.id,
            node: result,
            items: [
              {
                name: name,
                amount: amount
              }
            ]
          }
        ],
        dstNodes: [],
        trash: {},
        recipe: null,
        root: false,
        goal: true
      }
      rootNode.trash[name] = false
      return rootNode
    } else {
      return this.searchRecurse(name, amount, duplicated, priority)
    }
  }
}

export default FlowGenerator

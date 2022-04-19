#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const readline = require('readline')

const swig = require('swig')

interface Article {
  title?: string
  link?: string
  description?: string
}

interface Category {
  name?: string
  articles?: Article[]
}

module.exports = function (file, subject, issue_number, editors) {
  const issue = fs.createReadStream(path.join(__dirname, '..', file), 'utf-8')

  const meta = {
    subject: subject,
    issue_number: issue_number,
    categories: [] as Category[],
    editors: editors?.split(',') || [] as string[]
  }

  let category: Category = {}
  let article: Article = {}

  let inCategory = false
  let inArticle = false

  const rl = readline.createInterface({
    input: issue,
    output: null
  })

  rl.on('line', function (line) {
    if (line.startsWith('####')) {
      if (inCategory) {
        meta.categories.push(category)
        category = {}
      }
      inCategory = true
      category.name = line.slice(4).trim()
      category.articles = []
      return
    }

    let linkTextMatch = line.match(/(?:__|[*#])|\[(.*?)\]\((.*?)\)/)

    if (linkTextMatch) {
      inArticle = true
      article.title = linkTextMatch[1]
      article.link = linkTextMatch[2]
      return
    }

    if (inArticle) {
      article.description = line
      category.articles?.push(article)
      article = {}
      inArticle = false
      return
    }
  })

  return new Promise((resolve, reject) => {
    rl.on('close', function () {
      meta.categories.push(category)

      const result = swig.renderFile(path.join(__dirname, 'email.tpl.html'), meta)

      fs.writeFile(path.join(__dirname, 'email.html'), result, (err) => {
        if (err) {
          reject(err);
        }
        resolve(result);
      })
    })
  })
}

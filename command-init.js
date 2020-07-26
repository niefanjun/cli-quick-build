#!/usr/bin/env node

const { program } = require('commander')
const path = require('path')
const fs = require('fs-extra')
const glob = require('glob')
const inquirer = require('inquirer')
const download = require('./lib/download')
const generator = require('./lib/generator')

program.usage('<project-name>').parse(process.argv);

// 根据输入，获取项目名称
let projectName = program.args[0]

if (!projectName) {  // project-name 必填
    // 相当于执行命令的--help选项，显示help信息，这是commander内置的一个命令选项
    program.help()
    return
}

const list = glob.sync('*')  // 遍历当前目录
let rootName = path.basename(process.cwd())

let next = undefined; // 属于变为异步之后用来储存promise

if (list.length) {  // 如果当前目录不为空
    if (list.filter(name => {
        return name.indexOf(projectName) !== -1
    }).length !== 0) {
        console.log(`项目${projectName}已经存在`)
        next = Promise.resolve(projectName)
    }
    // rootName = projectName
    next = Promise.resolve(projectName);
} else if (rootName === projectName) {
    // rootName = '.'
    next = inquirer.prompt([
        {
            name: 'buildInCurrent',
            message: '当前目录为空，且目录名称和项目名称相同，是否直接在当前目录下创建新项目？',
            type: 'confirm',
            default: true
        }
    ]).then(answer => {
        return Promise.resolve(answer.buildInCurrent ? '.' : projectName)
    })
} else {
    next = Promise.resolve(projectName);
}

next && go()

function go() {
    let pathName = undefined;
    let downloadName = undefined;
    next.then(projectRoot => {
        pathName = path.resolve(process.cwd(), projectName);
        console.log('正在生成');
        return download(pathName)
            .then(target => {
                downloadName = target;
                return {
                    name: projectRoot,
                    root: projectRoot
                }
            })
    }).then(context => {
        return inquirer.prompt([
            {
                name: 'projectName',
                message: '项目的名称',
                default: context.name
            }, {
                name: 'projectVersion',
                message: '项目的版本号',
                default: '1.0.0'
            }, {
                name: 'projectDescription',
                message: '项目的简介',
                default: `A project named ${context.name}`
            }, {
                name: 'projectGit',
                message: '项目库地址',
                default: ''
            }
        ])
    }).then(context => {
        return generator(context, downloadName ,pathName)
    }).then(() => {
        console.log('创建成功')
    }).catch(err => {
        console.error(err)
    })
}

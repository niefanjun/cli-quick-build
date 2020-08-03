const Metalsmith = require('metalsmith')
const Handlebars = require('handlebars')
const rm = require('rimraf').sync

const path = require('path');
const fs = require('fs');

function renameTemplate(dest) {
    const dirlist = fs.readdirSync(dest);
    dirlist.forEach(item => {
        if (item.match(/\.template$/)) {
            fs.renameSync(path.resolve(dest, item), path.resolve(dest, item.replace(/\.template$/,'')));
        }
    })
}

module.exports = function (metadata = {}, src, dest = '.') {
    if (!src) {
        return Promise.reject(new Error(`无效的source：${src}`))
    }

    return new Promise((resolve, reject) => {
        Metalsmith(process.cwd())
            .metadata(metadata)
            .clean(false)
            .source(src)
            .destination(dest)
            .use((files, metalsmith, done) => {
                const meta = metalsmith.metadata()
                Object.keys(files).forEach(fileName => {
                    if (fileName.match(/\.template$/)) {
                        const t = files[fileName].contents.toString()
                        files[fileName].contents = Buffer.from(Handlebars.compile(t)(meta))
                    }
                })
                done()
            }).build(err => {
                renameTemplate(dest)
                rm(src)
                err ? reject(err) : resolve()
            })
    })
}

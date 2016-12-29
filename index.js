
const url = require('url')
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')





function listPkgs(){
  let root = execSync('npm root', { cwd: process.cwd() }).toString().replace('\n','')
  const pkgPath = path.join(root,'/../','./package.json')
  if (!fs.existsSync(pkgPath)) {
    console.log(pkgPath)
    process.exit(0)
  }
  try {
    var pkgJson = JSON.parse(fs.readFileSync(pkgPath))
  } catch(e) {

  }
  let deps = pkgJson.dependencies
  if (deps) {

    console.log(

      Object.keys(deps).filter(function(key){
        return url.parse(deps[key]).host === "github.com"
     }).join("\n")
    )


  }


}



function main(){

  const pkgPath = path.join(process.cwd(),'./package.json')
  if (!fs.existsSync(pkgPath)) {
    console.error(`checker-outer: ${pkgPath} does not exist!`)
    process.exit(1)
  }

  try {
    var pkgJson = JSON.parse(fs.readFileSync(pkgPath,'utf-8'))
  } catch(e) {
    console.error(`checker-outer: Error parsing package.json`)
    throw new Error(e)
  }

  let deps = pkgJson.dependencies
  let newDeps = {}





  if (process.argv[2]){
    var pkgName = process.argv[2]
    if (typeof deps[pkgName] === "undefined") {
      console.error(`${pkgName} does not exist in ${pkgPath}`)
      process.exit(1)
    }
    else {
      repofy(pkgName, deps[pkgName])
    }
  }
  else {
    for (let key in deps) {
      let pkgUrl = deps[key]
      if (isRepofyable(pkgUrl)) {
        repofy(key,pkgUrl)
      }

    }
  }
}




function isRepofyable(pkgUrl) {

  let urlObj = url.parse(pkgUrl)

  return (urlObj.protocol !== null && 
    urlObj.hostname === "github.com")
}


function repofy(pkgName, pkgUrl) {

  let urlObj = url.parse(pkgUrl)

  if (urlObj.hash !== null) {
    var branch = urlObj.hash.replace("#","")
    urlObj.hash = null

  } else {
    var branch = 'master'
  }

  urlObj.protocol = "ssh:"

  let newPkgUrl = urlObj.format()

  console.log(newPkgUrl, pkgName, branch)

  let root = execSync('npm root', { cwd: process.cwd() }).toString().replace('\n','')

  let pkgRoot = path.join(root,pkgName)

  let pkgJson = JSON.parse(fs.readFileSync(path.join(pkgRoot,'/package.json'),'utf-8'))

  let version = pkgJson.version || (function(){ throw new Error(`Could not determine ${pkgName} version`)})()


  let commands = []

  if (fs.existsSync(path.join(pkgRoot,'.git/config'))){

    commands = [
      [`git remote add github ${newPkgUrl}`, noop],
      [`git fetch github ${branch}`, noop],
      [`git checkout ${branch}`, fail]
    ]

  }
  else {

    commands = [
      //  [`cd ${pkgRoot}`, fail ],
      [`git init .`, fail ],
      [`git checkout -b npm_${version}`, failRecover(`git checkout npm_${version}`, pkgRoot)],
      [`git add -f .`, fail ],
      [`git commit -m "commit of current contents"`, fail],
      [`git remote add github ${newPkgUrl}`, noop],
      [`git fetch github ${branch}`, noop],
      [`git checkout ${branch}`, fail]
      //,[`git clean -f`, fail]
    ]


  }

  commandRunner(commands, pkgRoot)
}

function noop(){
  ;;
}

function commandRunner(commands, root, verbose = true) {

  for (let [cmd, failHandler] of commands) {
    if (typeof cmd !== "undefined") {
      try {
        let result = execSync(cmd, { cwd: root })
        if (verbose) console.log(result.toString())
      } catch(e) {
        failHandler(cmd, (e.stderr || e).toString())
      }
    }
  }
}


function fail(cmd, error, recover = false) {

  console.error(`ERROR: Command '${cmd}' failed:`, error)
  if (!recover) {
    console.error('No Recover ... finishing')
    process.exit(1)
  }

}

function failRecover(recoverCMD, cwd) {
  return function(){
    execSync(recoverCMD, { cwd })
  }
}


module.exports = { main, listPkgs }

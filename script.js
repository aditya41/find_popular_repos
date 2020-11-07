const token = 'd5ad006c2f785cd9d36869ee8d7ba6149181a7e4'

$(() => {
    $('#load').hide()
    $('#btn').click(() => {
        const org_name = $('#org-name').val()
        const repo_input = $('#repo-input').val()
        const contributor_input = $('#contributor-input').val()
        $('#load').show()
        $('#list').empty()
        $.get(`https://api.github.com/orgs/${org_name}`, (data, status) => {
            if (status != "success") {
                throw new Error('Something wrong')
            }

            const repo_count = parseInt(data.public_repos)
            let pages = repo_count
            let repos = []

            if (repo_count % 100 == 0) {
                pages = parseInt(repo_count / 100)
            } else {
                pages = parseInt(repo_count / 100) + 1
            }

            console.log(pages)

            let promiseArray = []

            for (let index = 0; index < pages; index++) {
                promiseArray.push(getPageData(`https://api.github.com/orgs/${org_name}/repos?per_page=100&page=${index+1}`))
            }

            Promise.all(promiseArray).then((data) => {
                data.forEach((page) => {
                    page.forEach((repo) => {
                        repos.push(repo)
                    })
                })

                repos.sort(function(a, b) {
                    return b.forks - a.forks
                })

                const repoArray = repos.slice(0, repo_input)

                // console.log(repoArray)

                let newPromiseArray = []

                repoArray.forEach((repo) => {
                    newPromiseArray.push(getContributorData(`https://api.github.com/repos/${org_name}/${repo.name}/stats/contributors`))
                })

                Promise.all(newPromiseArray).then((data) => {

                    const final = []
                    let i = 0
                    data.forEach((arr) => {
                        arr.reverse()
                        final.push({
                            contributors: arr.slice(0, contributor_input),
                            details: repoArray[i]
                        })
                        i++
                    })

                    // console.log(final)
                    let output = []

                    for (let i = 0; i < final.length; i++) {
                        let contributersFinal = []
                        contributersFinal.push(`<ol>`)
                        for (let j = 0; j < final[i].contributors.length; j++) {
                            contributersFinal.push(`<li><b>Contributer name:</b> ${final[i].contributors[j].name}        
                             <b>Commits:</b> ${final[i].contributors[j].commits}</li>`)
                        }
                        contributersFinal.push(`</ol>`)
                        output.push(
                            `<li>
                            <b>Repo-name:</b> ${final[i].details.name}  <b>Total-Forks:</b> ${final[i].details.forks} <br>
                            <b><i>top contributers are</i></b><br> <br>
                            ${contributersFinal}
                            </li><hr>`
                        )
                    }
                    $('#load').hide()

                    $('#list').append(output)


                })
            })


        })

    })
})

const getPageData = async(url) => {
    return new Promise((resolve, reject) => {
        $.get(url, (data, status) => {
            if (status != "success") {
                reject(new Error('Something Wrong'))
            }

            let arr = []
            data.forEach(repo => {
                arr.push({
                    name: repo.name,
                    forks: repo.forks
                })
            })

            resolve(arr)
        })
    })
}

const getContributorData = async(url) => {
    return new Promise((resolve, reject) => {
        $.ajaxSetup({
            headers: {
                'Authorization': "token " + token
            }
        })
        $.get(url, (data, status) => {
            if (status != "success") {
                reject(new Error('Something Wrong'))
            }

            let arr = []
            console.log(data)
            data.forEach((contributor) => {
                arr.push({
                    name: contributor.author.login,
                    commits: contributor.total
                })

            })

            resolve(arr)

        })
    })
}
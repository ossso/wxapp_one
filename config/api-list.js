const applist = {
    home: {
        type: "get",
        params: ["page"],
    },
    list: {
        type: "get",
        params: ["page", "cateid"],
    },
    catelist: {
        type: "get",
        params: [],
    },
    article: {
        type: "get",
        params: ["id"]
    },
    page: {
        type: "get",
        params: ["id"]
    },
    comment: {
        type: "get",
        params: ["id"]
    },
    search: {
        type: "get",
        params: ["page", "keyword"],
    },
    user: {
        type: "get",
        params: []
    },
    login: {
        type: "post",
        params: []
    },
    bind: {
        type: "post",
        params: ["username", "password"]
    },
    postcomment: {
        type: "post",
        params: ["postid", "content"]
    },
}

exports = module.exports = applist

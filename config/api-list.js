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
        params: ["id", "page"]
    },
    search: {
        type: "get",
        params: ["page", "keyword"],
    },
    user: {
        type: "post",
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
    unbind: {
        type: "post",
        params: []
    },
    postcomment: {
        type: "post",
        params: ["postid", "content"]
    },
}

exports = module.exports = applist

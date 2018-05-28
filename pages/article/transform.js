const HtmlToJson = require('../../modules/wxParse/html2json');

const richTextHtmlTagList = ['a','abbr','b','blockquote','br','code','col','colgroup','dd','del','div','dl','dt','em','fieldset','h1','h2','h3','h4','h5','h6','hr','i','img','ins','label','legend','li','ol','p','q','span','strong','sub','sup','table','tbody','td','tfoot','th','thead','tr','ul'];

const richTextNotHtmlTag = ['embed', 'iframe'];

class TransformHTML {
    constructor() {}

    /**
     * 转换数据
     */
    handler(content) {
        const contentNodes = HtmlToJson.html2json(content);
        const images = contentNodes.images.map(item => item.attr.src);
        const nodes = this.getNodes(contentNodes.nodes);
        return {
            nodes,
            images
        };
    }

    // 获取可用于微信小程序的节点
    getNodes(list) {
        return list.map((item) => {
            const node = {};
            if (item.node === 'text') {
                node.type = 'text';
                node.text = item.text;
            } else {
                node.type = 'node';
                node.name = item.tag;
                node.attrs = {};
                if (item.attr) {
                    Object.entries(item.attr).forEach((item) => {
                        if (Array.isArray(item[1])) {
                            node.attrs[item[0]] = item[1].join('');
                        } else {
                            node.attrs[item[0]] = item[1].toString();
                        }
                    });
                }
                // 添加标签class name
                if (node.attrs.class) {
                    node.attrs.class += ` wxapp-html-tag-${node.name}`;
                } else {
                    node.attrs.class = `wxapp-html-tag-${node.name}`;
                }

                if (richTextNotHtmlTag.indexOf(node.name) > -1) {
                    node.name = 'div';
                    node.attrs.class = 'wxapp-html-tag-tips';
                    node.children = [{
                        type: 'text',
                        text: '小程序暂时不支持的内容',
                    }];
                    delete item.nodes;
                } else if (richTextHtmlTagList.indexOf(node.name) === -1) {
                    // 处理小程序不允许的标签
                    if (item.tagType === 'block') {
                        node.name = 'div';
                        if (item.nodes) {
                            const blockNode = {
                                name: 'div',
                                attrs: {
                                    class: `wxapp-block-content wxapp-html-type-${item.tag}`,
                                },
                                children: [
                                    Object.assign({}, node, {
                                        children: this.getNodes(item.nodes),
                                    }),
                                ],
                            };
                            return blockNode;
                        }
                    } else if (item.tagType === 'inline') {
                        node.name = 'span';
                    } else {
                        return {
                            type: 'text',
                            text: '',
                        }
                    }
                }
            }
            // 循环处理子节点
            if (item.nodes) {
                node.children = this.getNodes(item.nodes);
            }
            return node;
        });
    }
}

const t = new TransformHTML();

exports = module.exports = html => t.handler(html);

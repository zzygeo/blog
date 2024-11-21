import {viteBundler} from '@vuepress/bundler-vite'
import {defaultTheme} from '@vuepress/theme-default'
import {defineUserConfig} from 'vuepress'

export default defineUserConfig({
    bundler: viteBundler(),
    theme: defaultTheme({
        sidebar: [
            {
                text: 'java',
                link: '/java/',
                collapsible: true,
                depth: 3,
                children: [
                    {
                        text: 'elasticsearch',
                        link: '/java/elasticsearch/setup',
                        collapsible: true,
                        children: [
                            {
                                text: '安装',
                                link: '/java/elasticsearch/setup',
                            },
                            {
                                text: '简单使用',
                                link: '/java/elasticsearch/use',
                            }
                        ]
                    },
                    {
                        text: 'logstash',
                        link: '/java/logstash/use',
                        collapsible: true,
                        children: [
                            {
                                text: '简单使用',
                                link: '/java/logstash/use',
                            }
                        ]
                    },
                    {
                        text: '时区问题',
                        link: '/java/timezone/',
                        collapsible: true,
                    },
                    {
                        text: 'springcloud',
                        link: '/java/springcloud/nacos',
                        collapsible: true,
                        children: [
                            {
                                text: 'nacos',
                                link: '/java/springcloud/nacos',
                            },
                            {
                                text: 'sentinel',
                                link: '/java/springcloud/sentinel',
                            }
                        ]
                    }
                ]
            },
            {
                text: '设计模式',
                link: '/pattern/',
                collapsible: true,
                children: [
                    {
                        text: '分类及简单示例',
                        link: '/pattern/introduce'
                    }
                ]
            },
            {
                text: '服务器',
                link: '/server/',
                collapsible: true,
            }
        ]
    }),
    base: '/blog/',
    lang: 'zh-CN',
    title: '西瓜🍉',
    description: '西瓜哥学代码',
})

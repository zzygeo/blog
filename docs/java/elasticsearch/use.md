## 思路

把elastic search当作mysql去学习，就比较清晰了。

**创建表、增删改查、客户端调用es**等就是最基本的功能了。

## 索引

### 正向索引

拿着书籍的目录去找页码，这样的场景就是正向索引。

### 倒排索引

elastic会将输入的文字进行分词，例如：

```text
你好，大熊猫 => 你好|大熊猫
你好，java => 你好|java
早上好，大熊猫 => 早上好|大熊猫
```

根据分词结果构建索引表，记录文本信息。

| 索引   | 文章  |
|------|-----|
| 你好   | A、B |
| 大熊猫  | A、C |
| java | B   |
| 早上好  | C   |

在进行搜索的时候，先分词以后，然后去查询索引表，查出文章的信息。

## 调用方式

### http请求

简单的请求可以直接使用curl的方式进行调用

### kibana

直接使用kibana的devtools进行调用，在生产环境一般不使用。

### 客户端

主要有三种：
1. elastic search官网的[java client](https://www.elastic.co/guide/en/elasticsearch/client/java-api-client/current/index.html)
2. elastic search8舍弃的[Transport Client](https://www.elastic.co/guide/en/elasticsearch/client/java-api/current/transport-client.html)
3. spring-data系列的[spring-data-elasticsearch](https://docs.spring.io/spring-data/elasticsearch/docs/4.4.14/reference/html/#reference)

建议使用spring-data-elasticsearch，具体移步[java里集成章节](#java里集成)。

## 使用（DSL）

### 插入数据并创建文档

这种带有@timestamp和event字段的数据是ecs的数据类型，可以更好的记录事件（如日志），它的查询和普通的查询不相同。

```json
POST logs-my_app-default/_doc
{
  "name": "zzy"
  "@timestamp": "2099-05-06T16:21:15.000Z",
  "event": {
    "original": "192.0.2.42 - - [06/May/2099:16:21:15 +0000] \"GET /images/bg.jpg HTTP/1.0\" 200 24736"
  }
}
```

### 查询文档

```json
GET logs-my_app-default/_search
{
  "query": {
    "match_all": { }
  },
  "sort": [
    {
      "@timestamp": "desc"
    }
  ]
}
```

### 查询部分字段数据

```json
GET logs-my_app-default/_search
{
  "query": {
    "match_all": { }
  },
  "fields": [
    "@timestamp"
  ],
  "_source": false,
  "sort": [
    {
      "@timestamp": "desc"
    }
  ]
}

```

### 删除文档

删除文档及索引

```text
DELETE _data_stream/logs-my_app-default 
```

删除文档

```text
DELETE {document}
```

### 查询单条数据

```text
GET post/_doc/{id}
```

### 修改单条数据

```json
POST post/_doc/v4In15IBQ7S0DDlRGJi0
{
  "name": "tyt"
}
```

### 查询表结构

```text
GET post/_mapping
```

## EQL

elastic search 的 [EQL](https://www.elastic.co/guide/en/elasticsearch/reference/7.17/eql.html)（Event Query Language）查询是一种用于分析日志和时间序列数据的查询语言。

**eql查询主要针对ecs文档结构**。

## SQL

elastic search还支持像sql一样的查询语句，[sql查询](https://www.elastic.co/guide/en/elasticsearch/reference/7.17/query-dsl.html)

**可能需要额外插件支持，解析sql可能会带来性能问题**。

```json
post /_sql?format=txt
{
  "query": "select * from post where name like '%鱼%'"
}
```

## painless

编程式取值，比较灵活，但是学习成本高。

## mapping

mapping类似mysql里的表，在elastic里，mapping描述了怎么组合一个文档。

### 动态mapping

mapping是动态结构，可以改变，添加一个包含新字段的数据进去，mapping结构发生改变了。

### 显式mapping

在创建文档的时候，也可以指定mapping。

```json
PUT /post
{
  "mappings": {
    "properties": {
      "age":    { "type": "integer" },  
      "email":  { "type": "keyword"  }, 
      "name":   { "type": "text"  }     
    }
  }
}
```

## 分词器

### 空格分词器

得到['The', 'quick', 'brown', 'fox']词组。

```json
POST _analyze
{
  "analyzer": "whitespace",
  "text":     "The quick brown fox."
}
```

### 标准分词规则

指定了一些**过滤器**，将大写转小写，韵母折叠。最后得到的结果是这样的。
['is', 'this', 'deja', 'vu']

```json
POST _analyze
{
  "tokenizer": "standard",
  "filter":  [ "lowercase", "asciifolding" ],
  "text":      "Is this déja vu?"
}
```

### 给特定字段指定分词器

下面的语句创建了一个文档，并且给字段指定了分词器。

```json
PUT my-index-000001
{
  "settings": {
    "analysis": {
      "analyzer": {
        "std_folded": { 
          "type": "custom",
          "tokenizer": "standard",
          "filter": [
            "lowercase",
            "asciifolding"
          ]
        }
      }
    }
  },
  "mappings": {
    "properties": {
      "my_text": {
        "type": "text",
        "analyzer": "std_folded" 
      }
    }
  }
}

GET my-index-000001/_analyze 
{
  "analyzer": "std_folded", 
  "text":     "Is this déjà vu?"
}

```

### ik分词器（中文）

[analysis-ik](https://github.com/infinilabs/analysis-ik), **ik_smart**分词规则是智能分词，将句子分成最像词语的情况，**ik_max_word**是按最大粒度去分词，尽可能多的分出词语来。

## 打分机制

假如有三条内容：
1. 小王是狗
2. 小王是长颈鹿
3. 你是长颈鹿

当搜索小王的时候，1会胜出，因为第一条不仅匹配了关键词而且句子更短。

当搜索小王，长颈鹿时，2 > 3 > 1。

如何计算文档相关性得分并排序，参考[相关性排序算法](https://lanffy.github.io/2019/05/08/Elasticsearch-Search-Score-Algorithm)。

## java里集成

### ElasticsearchRepository方式

直接集成ElasticsearchRepository这个接口，调用现成的方法或者按它的命名规则创建的方法，即可查询到数据。

```java
public interface PostRepository extends ElasticsearchRepository<Post, Long> {
    List<Post> findByTitle(String title);
}
```

测试例子：

```java
@SpringBootTest
class LearnElasticsearchApplicationTests {

    @Resource
    PostRepository postRepository;

    @Test
    void testSave() {
        Post post = new Post();
        post.setId(2L);
        post.setTitle("今天要学习");
        post.setContent("今天学习的是数学");
        post.setUserId(2L);
        post.setCreateTime(new Date());
        post.setUpdateTime(new Date());
        Post post1 = postRepository.save(post);
        System.out.println(post1);
    }


    @Test
    void testFindAll() {
        Page<Post> list = postRepository.findAll(PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "createTime")));
        list.forEach(System.out::println);
    }

    @Test
    void findByTitle() {
        List<Post> list = postRepository.findByTitle("学习");
        System.out.println(list);
    }

}
```

### EleasticsearchTemplate方式

elasticsearchtemplate提供了更加灵活的查询，它的编写是基于dsl语法来构建的。

比如我有以下的dsl语句：

```json
GET post/_search
{
  "query": {
    "bool": {
      "must": [
        {
          "match": {
            "title": "今天"
          }
        },
        {
          "match": {
            "content": "数学"
          }
        }
      ]
    }
  },
  "from": 0,
  "size": 5,
  "_source": ["id", "title", "userId"],
  "sort": [
    {
      "id": {
        "order": "desc"
      }
    },
    {
      "_score": {
        "order": "desc"
      }
    }
  ]
}
```

以elasticsearchtemplate的写法构建：

```java
@Service
public class PostSearch {
    @Autowired
    private ElasticsearchRestTemplate elasticsearchTemplate;

    public Page<Post> search(Post post) {
        String title = post.getTitle();
        String content = post.getContent();

        // 根据dsl的json参数来构建代码
        BoolQueryBuilder boolQueryBuilder = QueryBuilders.boolQuery();
        // bool里构建must filter等
        if (title != null) {
            boolQueryBuilder.must(QueryBuilders.matchQuery("title", title));
        }
        if (content != null) {
            boolQueryBuilder.must(QueryBuilders.matchQuery("content", content));
        }

        // 排序
        ScoreSortBuilder scoreSortBuilder = SortBuilders.scoreSort().order(SortOrder.DESC);
        FieldSortBuilder fieldSortBuilder = SortBuilders.fieldSort("id").order(SortOrder.DESC);

        // 筛选字段
        FetchSourceFilter fetchSourceFilter = new FetchSourceFilter(new String[]{"id", "title", "userId"}, null);

        // 分页
        PageRequest pageRequest = PageRequest.of(0, 10);

        // 构建查询
        NativeSearchQuery build = new NativeSearchQueryBuilder().withQuery(boolQueryBuilder).withPageable(pageRequest).withSourceFilter(fetchSourceFilter)
                .withSort(scoreSortBuilder).withSort(fieldSortBuilder).build();
        SearchHits<Post> search = elasticsearchTemplate.search(build, Post.class);
        return null;
    }
}
```

## 数据同步

一般情况下，如果做查询搜索功能，使用es来模糊搜索，但是数据是存放在数据库里的，所以需要将**数据库里的数据与es进行同步，保持数据一致性（数据库为主）**。

首次安装完es，进行全量同步，系统运行时采用增量同步。以下是四种实现方式

### 定时任务

比如每分钟查询前三分钟内修改的数据，然后更新到es里。

优点：简单易用，无需额外引入中间件。

缺点：有时间差。

应用场景：数据短时间内不同步影响不大。

### 双写

写数据的时候，将数据写入es，更新、删除数据同理，要开启**事务**（先保证数据库的成功，再去操作es，如果es更新失败，通过**定时任务+日志+告警进行检测和修复**）

### LogStash

[LogStach](https://www.elastic.co/guide/en/logstash/7.17/introduction.html#power-of-logstash)是一个收集和处理数据的管道。

采用LogStash数据同步管道（一般要配合kafka消息队列+beats采集器）,这种数据同步的方式的实现移步[logstash章节](../logstash/use.md#介绍)。

### 订阅数据库流水的同步方式-Canal

[canal增量订阅](https://github.com/alibaba/canal)

优点：实时同步、实时性非常强。

原理：数据库每次修改时，会修改binlog文件，只要监听该文件的修改，就能第一时间得到消息并处理。

**canal伪装成了mysql的从节点，获取主节点给的binlog**。

![canal原理](https://github.com/zzygeo/picx-images-hosting/raw/master/20241031/canal原理.4uaxtatrlc.webp)

## tips

介绍一些elasticsearch使用的知识点。

### 关键子句must和filter

- must子句的查询会影响文档的**得分**，elasticsearch会计算每个文档与查询的匹配度，根据相似性算法来给文档打分。
- filter不会影响文档的得分，它关心的是文档是否匹配，通常filter在查询性能上更高效，会缓存经常使用的过滤器结果。

### 标签高亮

在dsl语法里设置highlight属性，这样查出来的数据里匹配的词组就包上了一层高亮的标签。

```json
GET /_search
{
  "query": {
    "match": { "content": "kimchy" }
  },
  "highlight": {
    "fields": {
      "content": {}
    }
  }
}
```

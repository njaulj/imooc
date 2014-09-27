#imooc -- 慕课网视频下载器

## 使用方法

imooc是基于NodeJS的慕课网视频查询，下载管理工具。

**1、显示最近的课程的列表

```javascript

// 默认显示第一页
imooc list;

// 指定获取页
imooc list -p 2;

```
**2、查找课程

```javascript

// 根据指定的关键字查询课程
imooc search 关键字;

```

**3、获取课程章节信息
```javascript

// 获取指定课程号的章节信息
imooc display 课程号;

```

**4、下载课程视频
```javascript

// 下载课程的所有章节视频
imooc get 课程号

// 下载指定章节
imooc get 课程号 -c 1,2

```
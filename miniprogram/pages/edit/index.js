/* 待办重新编辑页面 */
import { getDate, todayHasTargetWater } from '../../tools/index.js'

const DefaultDrink = {
  6: 400,
  9: 200,
  12: 400,
  14: 200,
  16: 400,
  18: 200,
}
const initData = {
  _id: '',
  title: '',
  desc: '',
  files: [],
  fileName: '',
  statusOptions: ['未完成', '已完成'],
  buyItems: ['catheter', 'tissue', 'mirror'],
  star: false,
  // totalWaterOptions: ['2000毫升', '2500毫升', '3000毫升'],
  // intervalsReminderOptions: ['1 小时', '2 小时', '3 小时', '自定义'],
  status: 0, // 这三个都是index
  // waterTotalIndex: 0,
  // intervalsIndex: 0,
  customIntervalItems: Array.from({ length: 24 }, (v, i) => ({
    name: `${i + 1} 点`,
    value: i + 1,
    checked: DefaultDrink[i+1] ? true : false,
    targetDrink: DefaultDrink[i+1] || '', // 这个时间段的目标饮水量. 默认有6次，早中晚饭各 200ml， 中间穿插3次，每次 400ml
    actualDrink: '', // 这个时间段的实际饮水量
    actualPee: '', // 这个时间段的实际排尿量
  })),
}

Page({
  getChildComponent: function () {
    const childData = this.selectComponent('.todoDetail');
    return childData;
  },
  // 类似 add 页面，存储正在编辑的待办信息
  data: {
    ...initData
  },

  async onLoad(options) {
    const childData = this.getChildComponent()
    // 根据上一页传来的 _id 值更新表单数据
    if (options.id !== undefined) {
      this.setData({
        _id: options.id
      })
      const db = await getApp().database()
      // 根据待办 _id 加载信息
      db.collection(getApp().globalData.collection).where({
        _id: this.data._id
      }).get().then(res => {
        // 解包获得 todo 对象
        const {
          data: [todo]
        } = res
        // 循环拼接展示的文件列表名，文件名过长时截断
        let fileName = ''
        const record = todo.record;
        for (let file of todo.files) {
          fileName += file.name.substr(0, 10) + (file.name.length > 10 ? "..." : "") + " "
        }
        // 如果整体文件名字符串过长则整体截断
        fileName = fileName.substr(0, 20) + (fileName.length > 20 ? "..." : "")
        // 查询dayliy表是否有今天的数据
        getApp().getOpenId().then(async openid => {
          db.collection(getApp().globalData.collection_daily).where({
            _openid: openid,
            date: new Date().toLocaleDateString()
          }).get().then(res => {
            const { data } = res;
            const { records: dailyRecord } = data[0] || [];
            const record = todo.record;
            if (dailyRecord && dailyRecord.length) {
              record.forEach((item, index) => {
                const recordItem = dailyRecord.find(r => r.time === item.value);
                if (recordItem) {
                  item.actualDrink = recordItem.num;
                }
              })
              childData.setDetailData({
                record
              })
            }
          })
        })
        childData.setDetailData({
          ...initData,
          _id: this.data._id,
          title: todo.title,
          desc: todo.desc,
          // buyItemsDesc: todo.buyItemsDesc,
          buyItems: todo.buyItems || [],
          files: todo.files,
          fileName,
          status: todo.status,
          record: record,
          intervalsIndex: todo.frequency === 'everyday' ? 0 : todo.frequency === 'workday' ? 1 : 2,
          selectdDaily: todo.frequency !== 'everyday' && todo.frequency !== 'workday' ? todo.frequency.split(',') : [],
          editMode: true,
          star: todo.star || false
        })
      })
    }
  },

  // 删除待办事项
  async deleteTodo() {
    const db = await getApp().database()
    // 根据待办 _id 删除待办事项
    db.collection(getApp().globalData.collection).where({
      _id: this.data._id
    }).remove()
    // 删除完成后，退回首页
    wx.navigateBack({
      delta: 2,
    })
  },

  cancelEdit() {
    wx.navigateBack({
      delta: 0,
    })
  },

  // 保存待办信息
  async saveTodo() {
    const data = this.getChildComponent().data
    // 对输入框内容进行校验
    if (data.title === '') {
      wx.showToast({
        title: '事项标题未填写',
        icon: 'error',
        duration: 2000
      })
      return
    }
    if (data.title.length > 10) {
      wx.showToast({
        title: '事项标题过长',
        icon: 'error',
        duration: 2000
      })
      return
    }
    if (data.desc.length > 100) {
      wx.showToast({
        title: '事项描述过长',
        icon: 'error',
        duration: 2000
      })
      return
    }
    const db = await getApp().database()

    // 这里需要分成两部分来存，首先是记录计划表，这是对每天来说都可能是一样的
    // 其次是更新每天实际的饮水量，这个是每天都会变化的
    // 在页面上为了方便用户使用和理解，在同一个表格中，数据库实际需要存在两张表里
    const dailyRecords = data.record.map((item, index) => {
      const temp = item.actualDrink;
      delete item.actualDrink;
      if (temp) {
        return {
          time: item.value,
          num: Number(temp)
        }
      }
    }).filter(item => !!item);

    // 校验通过后，根据待办 _id，更新计划
    data.updated_at = new Date().getTime()
    db.collection(getApp().globalData.collection).where({
      _id: this.data._id
    }).update({
      data
    }).then(() => {
      // 待办更新后，返回详情页
      wx.navigateBack({
        delta: 0,
      })
    }).catch(err => {
      console.log(err)
      wx.showToast({
        title: '保存失败，请稍后重试',
        icon: 'error',
        duration: 2000
      })
      wx.navigateBack({
        delta: 0,
      })
    })

    // 更新每日饮水记录
    getApp().getOpenId().then(async openid => {
      db.collection(getApp().globalData.collection_daily).where({
        _openid: openid,
        date: getDate()
      }).get().then(res => {
        const { data } = res;
        if (!data.length) {
          // 需要新建
          db.collection(getApp().globalData.collection_daily)
            .add({
              data: {
                userId: openid,
                date: new Date().toLocaleDateString(),
                records: dailyRecords
              }
            })
            .then(() => {
              wx.showToast({
                title: '保存成功',
                icon: 'success'
              })
              this.setData({
                show: false
              })
            }).catch(err => {
              console.log(err)
              wx.showToast({
                title: '保存失败，请稍后重试',
                icon: 'error',
                duration: 2000
              })
            })
        } else {
          // 已经存在
          const target = data[0]
          delete target._openid
          delete target._id
          const records = target.records || []
          dailyRecords.forEach(item => {
            const recordItem = records.find(r => r.time === item.time);
            if (recordItem) {
              recordItem.num = item.num;
            } else {
              records.push(item);
            }
          })
          db.collection(getApp().globalData.collection_daily).where({
            userId: target._id
          }).update({
            data: {
              ...target,
              records
            }
          }).then(() => {
            // wx.showToast({
            //   title: '保存成功',
            //   icon: 'success'
            // })
          }).catch(err => {
            console.log(err)
            wx.showToast({
              title: '保存失败，请稍后重试',
              icon: 'error',
              duration: 2000
            })
          })
        }
      })
    })
  }
})
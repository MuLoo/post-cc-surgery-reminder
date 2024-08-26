/* 新增待办页面 */
const DefaultDrink = {
  6: 400,
  9: 200,
  12: 400,
  14: 200,
  16: 400,
  18: 200,
}
Component({
  // 保存编辑中待办的信息
  behaviors: ['wx://component-export'],
  options: {
    multipleSlots: true, // 在组件定义时的选项中启用多slot支持
    styleIsolation: 'shared',
  },
  export() {
    return {
      data: {
        title: this.data.title, // 待办标题
        desc: this.data.desc, // 待办描述
        // buyItemsDesc: this.data.buyItemsDesc, // 待办购买清单
        buyItems: this.data.buyItems,
        files: this.data.files, // 待办附件列表
        status: Number(this.data.status), // 待办完成情况
        record: this.data.record,
        // waterTotalIndex: Number(this.data.totalWaterOptions[this.data.waterTotalIndex].slice(0, 4)), // 待办饮水总量
        // intervalsIndex: [0,1,2].includes(this.data.intervalsIndex) ? String(this.data.intervalsIndex) : 'custom',  // '1' '2' '3' '自定义'
        // reminderTime: this.generateIntervals(), // 待办提醒的时间，
        star: this.data.star,
        type: 'todo', // 'todo' 'urination'
        frequency: this.data.intervalsIndex == 0 ? 'everyday' : this.data.intervalsIndex == 1 ? 'workday' : this.data.selectdDaily.join(','),
      },
      resetTodo: this.resetTodo.bind(this),
      setDetailData: this.setDetailData.bind(this),
    }
  },

  properties: {
    data: {
      type: Object,
      value: {},
    },
    onComplete: {
      type: Function,
      value: () => {},
    }
  },
  data: {
    editMode: false,
    title: '',
    desc: '',
    // buyItemsDesc: '',
    buyItems: ['catheter', 'tissue', 'mirror'],
    star: false,
    files: [],
    fileName: '',
    statusOptions: ['未完成', '已完成'],
    // totalWaterOptions: ['2000毫升', '2500毫升', '3000毫升'],
    intervalsReminderOptions: ['每天', '工作日', '自定义'],
    customDaily: ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'],
    selectdDaily: ['星期一', '星期二', '星期三', '星期四', '星期五'],
    status: 0, // 这三个都是index
    intervalsIndex: 0,
    // waterTotalIndex: 0,
    record: Array.from({ length: 24 }, (v, i) => ({
      name: `${i + 1} 点`,
      value: i + 1,
      checked: DefaultDrink[i+1] ? true : false,
      targetDrink: DefaultDrink[i+1] || '', // 这个时间段的目标饮水量. 默认有6次，早中晚饭各 200ml， 中间穿插3次，每次 400ml
      actualDrink: '', // 这个时间段的实际饮水量
      // actualPee: '', // 这个时间段的实际排尿量
    })),
  },
  methods: {
    changeCheckbox(event) {
      if (!event.target.dataset.extraParam) {
        return
      }
      const index = event.target.dataset.extraParam.value - 1
      this.data.record[index].checked = event.detail;
      this.setData({
        record: this.data.record
      })
    },
    // 更改默认饮水量
    changeTargetDrink(event) {
      if (!event.target.dataset.extraParam) {
        return
      }
      const index = event.target.dataset.extraParam.value - 1
      this.data.record[index].targetDrink = Number(event.detail);
      this.setData({
        record: this.data.record
      })
    },
    // 更改实际饮水量
    changeActualDrink(event) {
      if (!event.target.dataset.extraParam) {
        return
      }
      if (!this.data.editMode) {
        wx.showToast({
          title: '新建模式时无需编辑实际饮水量',
          icon: 'error',
          duration: 2000,
        })
      }
      const index = event.target.dataset.extraParam.value - 1
      this.data.record[index].actualDrink = event.detail;
      this.setData({
        record: this.data.record
      })
    },
    // // 更改实际排尿量
    // changeActualPee(event) {
    //   if (!event.target.dataset.extraParam) {
    //     return
    //   }
    //   const index = event.target.dataset.extraParam.value - 1
    //   this.data.record[index].actualPee = event.detail;
    //   this.setData({
    //     record: this.data.record
    //   })
    // },
    // 表单输入处理函数
    onTitleInput(e) {
      this.setData({
        title: e.detail.value,
      })
    },
    onDescInput(e) {
      this.setData({
        desc: e.detail.value,
      })
    },
    // onBuyItemsInput(e) {
    //   this.setData({
    //     buyItemsDesc: e.detail.value,
    //   })
    // },
    onBuyItemsInputChange(event) {
      this.setData({
        buyItems: event.detail
      })
    },
    // 设计计划提醒的时间
    onChangeCustomDaily(e) {
      this.setData({
        selectdDaily: e.detail,
      })
    },
    // 上传新附件
    async addFile() {
      // 限制附件个数
      if (this.data.files.length + 1 > getApp().globalData.fileLimit) {
        wx.showToast({
          title: '数量达到上限',
          icon: 'error',
          duration: 2000,
        })
        return
      }
      // 从会话选择文件
      wx.chooseMessageFile({
        count: 1,
        type: 'image'
      }).then(res => {
        const file = res.tempFiles[0]
        // 上传文件至云存储
        getApp()
          .uploadFile(file.name, file.path)
          .then(res => {
            // 追加文件记录，保存其文件名、大小和文件 id
            this.data.files.push({
              name: file.name,
              size: (file.size / 1024 / 1024).toFixed(2),
              id: res.fileID,
            })
            // 更新文件显示
            this.setData({
              files: this.data.files,
              fileName: this.data.fileName + file.name + ' ',
            })
          })
      })
    },
    // 响应计划状态选择器
    onChooseFreq(e) {
      this.setData({
        status: e.detail.value,
      })
    },
    // // 选择总饮水量
    // onChooseWaterTotal(e) {
    //   this.setData({
    //     waterTotalIndex: e.detail.value
    //   })
    // },
    // 选择计划间隔
    onChooseIntervals(e) {
      console.log(e.detail.value)
      this.setData({
        intervalsIndex: Number(e.detail.value),
      })
    },
      // 重置所有表单项
    resetTodo() {
      this.setData({
        editMode: false,
        title: '',
        desc: '',
        // buyItemsDesc: '',
        files: [],
        fileName: '',
        statusOptions: ['未完成', '已完成'],
        // totalWaterOptions: ['2000ML', '2500ML', '3000ML'],
        // intervalsReminderOptions: ['2 小时', '2.5 小时', '3 小时'],
        status: 0,
        // waterTotalIndex: 0,
        // intervalsIndex: 0,
        record: Array.from({ length: 24 }, (v, i) => ({
          name: `${i + 1} 点`,
          value: i + 1,
          checked: DefaultDrink[i+1] ? true : false,
          targetDrink: DefaultDrink[i+1] || '', // 这个时间段的目标饮水量. 默认有6次，早中晚饭各 200ml， 中间穿插3次，每次 400ml
          actualDrink: '', // 这个时间段的实际饮水量
          // actualPee: '', // 这个时间段的实际排尿量
        })),
      })
    },
    setDetailData(data) {
      this.setData({
        ...data
      })
    }
  },

})
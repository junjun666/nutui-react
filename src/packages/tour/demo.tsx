import React, { useState } from 'react'
import Cell from '@/packages/cell'
import { Tour } from './tour'
import { Switch } from '../switch/switch'
import './demo.scss'

const TourDemo = () => {
  const [showTour3, setShowTour3] = useState(false)
  const steps = [
    {
      content: '70+ 高质量组件，覆盖移动端主流场景',
      target: 'target1',
    },
    {
      content: '支持一套代码同时开发多端小程序+H5',
      target: 'target2',
    },
    {
      content: '基于京东APP 10.0 视觉规范',
      target: 'target3',
      location: 'top-end',
    },
    {
      content: '支持定制主题，内置 700+ 个主题变量',
      target: 'target4',
      location: 'top-end',
    },
  ]

  const steps1 = [
    {
      content: '70+ 高质量组件，覆盖移动端主流场景',
      target: 'target5',
    },
  ]

  const steps2 = [
    {
      content: '支持一套代码同时开发多端小程序+H5',
      target: 'target6',
      popoverOffset: [40, 12],
      arrowOffset: -36,
    },
  ]

  const steps3 = [
    {
      content: '70+ 高质量组件，覆盖移动端主流场景',
      target: 'target7',
    },
  ]

  const steps4 = [
    {
      content: '70+ 高质量组件，覆盖移动端主流场景',
      target: 'target7',
    },
  ]

  const closeTour = () => {
    setShowTour3(false)
  }

  return (
    <>
      <div className="demo">
        <h2>基础用法</h2>
        <Cell
          title="点击试试"
          linkSlot={<Switch id="target7" />}
          onClick={() => {
            setShowTour3(true)
          }}
        />
        <Tour
          className="nut-custom-tour nut-customword-tour"
          isShowModel={showTour3}
          onClose={closeTour}
          steps={steps3}
          type="tile"
        ></Tour>
      </div>
    </>
  )
}

export default TourDemo

import React, { useState, useEffect, useRef, FunctionComponent } from 'react'
import { useRect } from '@/utils/useRect'
import Popover from '@/packages/popover'
import { PopoverTheme, PopoverLocation } from '@/packages/popover/popover'
import './tour.scss'
import { useConfig } from '@/packages/configprovider'
import classNames from 'classnames'
import bem from '@/utils/bem'

interface StepOptions {
  target: Element | string
  content: string
  location?: string
  popoverOffset?: number[]
  arrowOffset?: number
}

type TourType = 'step' | 'tile'

export interface TourProps {
  className: string
  isShowModel: boolean
  type: TourType
  location: PopoverLocation | string
  theme: PopoverTheme
  maskWidth: number | string
  maskHeight: number | string
  offset: number[]
  steps: StepOptions[]
  closeOnClickOverlay: boolean
  onClose: (e: React.MouseEvent<HTMLDivElement>) => void
}
const defaultProps = {
  className: '',
  isShowModel: false,
  type: 'step',
  theme: 'light',
  location: 'bottom',
  maskWidth: '',
  maskHeight: '',
  offset: [8, 10],
  closeOnClickOverlay: true,
} as TourProps
export const Tour: FunctionComponent<
  Partial<TourProps> & React.HTMLAttributes<HTMLDivElement>
> = (props) => {
  const { locale } = useConfig()
  const {
    children,
    className,
    closeOnClickOverlay,
    steps,
    theme,
    type,
    location,
    isShowModel,
    maskWidth,
    maskHeight,
    offset,
    onClose,
  } = {
    ...defaultProps,
    ...props,
  }

  const [showTour, setShowTour] = useState(true)
  const [showPopup, setShowPopup] = useState(true)
  const [active, setActive] = useState(0)

  const [maskRect, setMaskRect] = useState({
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 0,
    height: 0,
  })

  const b = bem('tour')
  const classes = classNames(className, b(''))

  useEffect(() => {
    console.log('showModel', isShowModel)
    if (isShowModel) {
      getRootPosition()
    }
    setActive(0)
    setShowTour(isShowModel)
    setShowPopup(isShowModel)
  }, [isShowModel])

  const getRootPosition = () => {
    const el: any = document.querySelector(`#${steps[active].target}`)
    const rect = useRect(el)
    setMaskRect(rect)
  }

  const maskStyle = () => {
    const { width, height, left, top } = maskRect
    const center = [left + width / 2, top + height / 2] // 中心点 【横，纵】
    const w: number = Number(maskWidth ? maskWidth : width)
    const h: number = Number(maskHeight ? maskHeight : height)
    const styles = {
      width: `${w + +offset[1] * 2}px`,
      height: `${h + +offset[0] * 2}px`,
      top: `${center[1] - h / 2 - +offset[0]}px`,
      left: `${center[0] - w / 2 - +offset[1]}px`,
    }
    return styles
  }

  const maskClose = (e: React.MouseEvent<HTMLDivElement>) => {
    setShowTour(false)
    setShowPopup(false)

    onClose && onClose(e)
  }

  const handleClickMask = (e: React.MouseEvent<HTMLDivElement>) => {
    closeOnClickOverlay && maskClose(e)
  }

  const itemList = [
    {
      name: '70+ 高质量组件，覆盖移动端主流场景',
    },
  ]

  return (
    <div className={classes}>
      <div
        className="nut-tour-masked"
        style={{ display: showTour ? 'block' : 'none' }}
        onClick={handleClickMask}
      ></div>

      {steps.map((item, index) => {
        if (index === active) {
          return (
            <>
              {showTour && (
                <div
                  className="nut-tour-mask"
                  id="nut-tour-popid"
                  style={maskStyle()}
                ></div>
              )}
              <Popover
                visible={showPopup}
                theme={theme}
                location={item.location || location}
                list={itemList}
              >
                {/* <div className="nut-tour-content nut-tour-content-tile">
                  <div className="nut-tour-content-inner">{item.content}</div>
                </div> */}
              </Popover>
            </>
          )
        }
      })}
    </div>
  )
}

Tour.defaultProps = defaultProps
Tour.displayName = 'NutTour'

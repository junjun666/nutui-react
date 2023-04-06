import React, {
  FunctionComponent,
  MouseEventHandler,
  useEffect,
  useRef,
  useState,
} from 'react'
import classNames from 'classnames'
import bem from '@/utils/bem'

export interface OverlayProps {
  zIndex: number
  duration: number
  className: string
  style: React.CSSProperties
  closeOnOverlayClick: boolean
  visible: boolean
  lockScroll: boolean
  afterShow: () => void
  afterClose: () => void
}
export const defaultOverlayProps = {
  zIndex: 1000,
  duration: 0.3,
  className: '',
  closeOnOverlayClick: true,
  visible: false,
  lockScroll: true,
  style: {},
} as OverlayProps
export const Overlay: FunctionComponent<
  Partial<OverlayProps> & React.HTMLAttributes<HTMLDivElement>
> = (props) => {
  const {
    children,
    zIndex,
    duration,
    className,
    closeOnOverlayClick,
    visible,
    lockScroll,
    style,
    afterShow,
    afterClose,
    ...rest
  } = {
    ...defaultOverlayProps,
    ...props,
  }
  const [show, setShow] = useState(visible)
  const renderRef = useRef(true)
  const intervalCloseRef = useRef(0)
  const intervalShowRef = useRef(0)

  useEffect(() => {
    if (visible) {
      intervalShowRef.current = window.setTimeout(() => {
        afterShow && afterShow()
      }, duration * 1000 * 0.8)
      setShow(visible)
    }
    lock()
  }, [visible])

  useEffect(() => {
    return () => {
      clearTimeout(intervalCloseRef.current)
      clearTimeout(intervalShowRef.current)
      document.body.classList.remove('nut-overflow-hidden')
    }
  }, [])

  const b = bem('overlay')

  const classes = classNames(
    {
      'overlay-fade-leave-active': !renderRef.current && !visible,
      'overlay-fade-enter-active': visible,
      'first-render': renderRef.current && !visible,
      'hidden-render': !visible,
    },
    className,
    b('')
  )

  const styles = {
    zIndex,
    animationDuration: `${props.duration}s`,
    ...style,
  }

  const lock = () => {
    if (lockScroll && visible) {
      document.body.classList.add('nut-overflow-hidden')
    } else {
      document.body.classList.remove('nut-overflow-hidden')
    }
  }

  const handleClick: MouseEventHandler<HTMLDivElement> = (e) => {
    if (closeOnOverlayClick) {
      afterClose && afterClose()
      props.onClick && props.onClick(e)
      renderRef.current = false
      intervalCloseRef.current = window.setTimeout(() => {
        setShow(!visible)
      }, duration * 1000 * 0.8)
    }
  }

  return (
    <>
      <div className={classes} style={styles} {...rest} onClick={handleClick}>
        {children}
      </div>
    </>
  )
}

Overlay.defaultProps = defaultOverlayProps
Overlay.displayName = 'NutOverlay'

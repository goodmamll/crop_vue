import { ElMessage, ElMessageBox, type Action } from "element-plus";
import dayjs from "dayjs";

function defaultMessage(message: string, type: 'success' | 'warning' | 'info' | 'error' = 'success', showClose: boolean = false, duration: number = 3000) {
    return ElMessage({
        message,
        type,
        showClose,
        duration
    })
}

function defaultMessageBox(contentText: string, boxType: 'success' | 'warning' | 'info' | 'error' = 'warning',
    doing: () => void = () => { }, undo: (action?: Action) => void = () => { }, title: string = 'Warning') {
    ElMessageBox.confirm(
        contentText,
        title,
        {
            confirmButtonText: 'Yes',
            cancelButtonText: 'Cancel',
            type: boxType,
        }
    )
        .then(doing)
        .catch(undo)
}

function promiseMessageBox(contentText: string, boxType: 'success' | 'warning' | 'info' | 'error' = 'warning', title: string = 'Warning') {
    return new Promise<boolean>((resolve) => {
        ElMessageBox.confirm(
            contentText,
            title,
            {
                confirmButtonText: 'Yes',
                cancelButtonText: 'Cancel',
                type: boxType,
            }
        ).then(() => {
            resolve(true)
        }).catch(() => resolve(false))
    })
}

function baseTimeFormat(Timetype: 'date' | 'dateTime' | 'time', time: string) {
    const day = dayjs(time)
    let ans = ''
    switch (Timetype) {
        case 'date':
            ans = day.format('YYYY-MM-DD')
            break;
        case 'time':
            ans = day.format('HH:mm-ss')
            break;
        case 'dateTime':
            ans = day.format('YYYY-MM-DD HH:mm:ss')
            break;
    }

    return ans
}

function convertHistoryData(data: any[], name: 'uploader_name' | 'downloader_name') {
    const ans: any[] = []
    // console.log(data);

    if (!data) return ans
    for (const d of data) {
        // console.log("***", name, "history_name===", d)
        d['Model'][name] = d['username']
        if (name === 'downloader_name') d['Model'].download_time = d['download_time']
        ans.push(d['Model'])
    }

    return ans
}

/**
 * blob 数据保存为文件
 * @param {*} blobData blob数据
 * @param {string} fileName 保存文件名、在mac上，文件名必须要写后缀，要不然下载会有问题、在window上可以忽略
 */
function blobSaveFile(blobData: any, fileName: string) {
    // const contentType = mimeType[extension]
    // if (contentType === undefined) {
    //   console.warn(`没有找到${extension}类型的文件`)
    // }
    fileName = decodeURI(fileName)

    const blob = new Blob([blobData] /* , { type: contentType } */)

    if ('msSaveOrOpenBlob' in window.navigator) {
        // ie使用的下载方式
        const openBlob = window.navigator.msSaveOrOpenBlob as Function
        return openBlob(blob, fileName)
    }

    const objectUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = objectUrl
    // 注意、在Mac OS上，文件名必须要写后缀，要不然下载会有问题; 在window上可以忽略
    a.download = fileName

    // 下面这个写法兼容火狐
    a.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }))
    window.URL.revokeObjectURL(objectUrl)
}

// Fix bug in date-picker: 修复日期选择器在点击确定按钮后，输入框不失去焦点的问题
// https://github.com/element-plus/element-plus/issues/13867
function handleDateChange(className: string) {
    const inputs = document.querySelectorAll(`.${className} input`)    
    for (const inputelem of inputs) {
        const inputElement = inputelem as HTMLInputElement
        inputElement.blur()
    }
}

export { defaultMessage, defaultMessageBox, promiseMessageBox, baseTimeFormat, convertHistoryData, blobSaveFile, handleDateChange }
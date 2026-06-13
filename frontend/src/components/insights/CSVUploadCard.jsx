import { Download, FileText, FileUp, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import {
  downloadCsvTemplate,
  uploadTransactionsCsv,
} from '../../api/importApi'

function getApiErrorMessage(error, fallbackMessage) {
  const detail = error.response?.data?.detail

  if (typeof detail === 'string') {
    return detail
  }

  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg).join(' ')
  }

  return fallbackMessage
}

function CSVUploadCard({ onImportSuccess, onUnauthorized }) {
  const fileInputRef = useRef(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [message, setMessage] = useState('')

  const handleFileChange = (event) => {
    const file = event.target.files?.[0]
    setMessage('')

    if (!file) {
      setSelectedFile(null)
      return
    }

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setSelectedFile(null)
      setMessage('Please choose a CSV file.')
      event.target.value = ''
      return
    }

    setSelectedFile(file)
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage('Choose a CSV file before importing.')
      return
    }

    try {
      setIsUploading(true)
      setMessage('')
      const response = await uploadTransactionsCsv(selectedFile)
      onImportSuccess(response.data)
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      if (error.response?.status === 401) {
        onUnauthorized()
        return
      }

      setMessage(getApiErrorMessage(error, 'Could not import CSV statement.'))
    } finally {
      setIsUploading(false)
    }
  }

  const handleDownload = async (downloadFn) => {
    try {
      setIsDownloading(true)
      setMessage('')
      await downloadFn()
    } catch (error) {
      if (error.response?.status === 401) {
        onUnauthorized()
        return
      }

      setMessage('Could not download the CSV file.')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <section className="soft-panel h-full px-4 py-4 sm:px-5">
      <div className="flex h-full flex-col gap-4">
        <div className="flex gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-cyan-200"
            style={{
              border: '1px solid var(--spfa-border-accent)',
              background: 'var(--spfa-accent)',
            }}
          >
            <FileUp size={19} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Upload CSV Statement</h3>
            <p className="mt-1 text-sm leading-6 text-slate-400">
              Import a statement to refresh insights and suggestions.
            </p>
            {selectedFile ? (
              <p className="mt-3 flex items-center gap-2 text-sm text-cyan-100">
                <FileText size={15} />
                <span className="break-all">{selectedFile.name}</span>
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-auto grid gap-2 sm:grid-cols-3">
          <input
            ref={fileInputRef}
            id="insights-csv-upload"
            type="file"
            accept=".csv,text/csv"
            className="peer sr-only"
            onChange={handleFileChange}
          />
          <label htmlFor="insights-csv-upload" className="secondary-button cursor-pointer gap-2 px-3 py-2.5 peer-focus-visible:outline peer-focus-visible:outline-3 peer-focus-visible:outline-offset-3 peer-focus-visible:outline-cyan-300">
            <FileText size={16} />
            <span>Choose CSV</span>
          </label>
          <button
            type="button"
            className="primary-button gap-2 px-3 py-2.5"
            onClick={handleUpload}
            disabled={isUploading}
          >
            <Upload size={16} />
            <span>{isUploading ? 'Importing...' : 'Import Statement'}</span>
          </button>
          <button
            type="button"
            className="secondary-button gap-2 px-3 py-2.5"
            onClick={() => handleDownload(downloadCsvTemplate)}
            disabled={isDownloading}
          >
            <Download size={16} />
            <span>Download Template</span>
          </button>
        </div>
      </div>

      {message ? (
        <div
          className="mt-4 rounded-lg border px-4 py-3 text-sm text-slate-200"
          style={{
            borderColor: 'rgba(244, 63, 94, 0.28)',
            background: 'rgba(244, 63, 94, 0.08)',
          }}
        >
          {message}
        </div>
      ) : null}
    </section>
  )
}

export default CSVUploadCard

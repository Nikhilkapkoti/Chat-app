"use client"

import type React from "react"

import { useState } from "react"
import { Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface FileUploadProps {
  onFileUpload: (file: File) => void
  onClose: () => void
}

export default function FileUpload({ onFileUpload, onClose }: FileUploadProps) {
  const [dragOver, setDragOver] = useState(false)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      onFileUpload(files[0])
      onClose()
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      onFileUpload(files[0])
      onClose()
    }
  }

  return (
    <div className="mt-2 p-4 border-2 border-dashed border-gray-300 rounded-lg relative">
      <Button variant="ghost" size="sm" onClick={onClose} className="absolute top-2 right-2">
        <X className="h-4 w-4" />
      </Button>

      <div
        className={`text-center ${dragOver ? "bg-gray-50" : ""}`}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
        <p className="text-sm text-gray-600 mb-2">Drag and drop a file here, or click to select</p>
        <input type="file" onChange={handleFileSelect} accept="image/*" className="hidden" id="file-upload" />
        <label htmlFor="file-upload" className="cursor-pointer text-blue-500 hover:text-blue-600">
          Choose file
        </label>
      </div>
    </div>
  )
}

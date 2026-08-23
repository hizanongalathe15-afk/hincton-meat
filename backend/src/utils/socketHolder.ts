import type { Server } from 'socket.io'

let ioInstance: Server | null = null

export const registerSocketIO = (instance: Server) => {
  ioInstance = instance
}

export const getSocketIO = (): Server | null => ioInstance

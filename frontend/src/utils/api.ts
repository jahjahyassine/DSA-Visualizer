/**
 * API client utilities for communicating with the FastAPI backend.
 */

import axios from 'axios'
import type { ExecutionResult, ExecuteRequest, Language, ExampleProgram } from '../types'

// Base URL — uses the Vite proxy in dev, or relative path in production
const BASE_URL = '/api'

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 30_000,  // 30s for code execution
  headers: {
    'Content-Type': 'application/json',
  },
})

/** Execute code and return execution trace */
export async function executeCode(req: ExecuteRequest): Promise<ExecutionResult> {
  const { data } = await client.post<ExecutionResult>('/execute', req)
  return data
}

/** Fetch available languages */
export async function fetchLanguages(): Promise<Language[]> {
  const { data } = await client.get<Language[]>('/languages')
  return data
}

/** Fetch example programs */
export async function fetchExamples(): Promise<Record<string, ExampleProgram[]>> {
  const { data } = await client.get<Record<string, ExampleProgram[]>>('/examples')
  return data
}

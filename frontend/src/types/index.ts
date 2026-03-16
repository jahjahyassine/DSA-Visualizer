// ============================================================
// Core data types for the execution trace and memory model
// These mirror the Python backend's snapshot format exactly
// ============================================================

/** A serialized Python value (primitive or reference) */
export interface SerializedValue {
  type: 'int' | 'float' | 'str' | 'bool' | 'None' | 'complex' | 'ref' |
        'function' | 'class' | 'error' | 'unknown';
  repr?: string;
  value?: number | string | boolean;
  id?: string | null;
}

/** A field in an object or element in a collection */
export interface FieldValue extends SerializedValue {
  index?: number;
  key?: string;
}

/** A serialized heap object */
export interface HeapObject {
  id: string;
  type: 'list' | 'dict' | 'tuple' | 'set' | 'instance';
  // List / tuple / set specific
  elements?: Array<{ index?: number; key?: string; value: SerializedValue }>;
  length?: number;
  truncated?: boolean;
  // Dict specific
  entries?: Array<{ key: string; value: SerializedValue }>;
  // Instance specific
  class_name?: string;
  fields?: Record<string, SerializedValue>;
}

/** A pointer/reference relationship */
export interface Pointer {
  from: string;   // e.g. "stack:main:head" or "obj:12345.next"
  to: string;     // heap object ID
  label: string | null;
}

/** A single stack frame */
export interface StackFrame {
  func_name: string;
  filename: string;
  line: number;
  locals: Record<string, SerializedValue>;
}

/** Detected data structure annotation */
export interface StructureAnnotation {
  structure: 'linked_list' | 'doubly_linked_list' | 'binary_tree' | 'tree' | 'graph' | 'linked_structure';
  class_name: string;
}

/** A single execution step / memory snapshot */
export interface ExecutionStep {
  step: number;
  line: number;
  event: 'line' | 'call' | 'return' | 'exception' | 'error';
  func_name: string;
  return_value?: SerializedValue;
  exception?: { type: string; message: string };
  error?: string;
  stack_frames: StackFrame[];
  heap: Record<string, HeapObject>;
  pointers: Pointer[];
  structures: Record<string, StructureAnnotation>;
  stdout: string;
}

/** Full execution result from the API */
export interface ExecutionResult {
  success: boolean;
  steps: ExecutionStep[];
  error: string | null;
  total_steps: number;
  language: string;
}

/** API request body */
export interface ExecuteRequest {
  code: string;
  language: string;
  stdin?: string;
}

/** A language option */
export interface Language {
  id: string;
  name: string;
  supported: boolean;
  version: string;
}

/** An example program */
export interface ExampleProgram {
  id: string;
  name: string;
  description: string;
  code: string;
}

/** React Flow node data types */
export interface HeapNodeData {
  obj: HeapObject;
  isNew?: boolean;
  isChanged?: boolean;
}

export interface StackNodeData {
  frame: StackFrame;
  isActive: boolean;
}

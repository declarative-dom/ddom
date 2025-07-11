/**
 * Namespace Type Definitions
 * 
 * Comprehensive type definitions for all namespace configurations in DDOM.
 * These define the structure of prototype-based namespace objects.
 * Types are compile-time only and don't affect runtime performance.
 */

/**
 * Base prototype configuration interface
 */
export interface PrototypeConfig {
  prototype: string;
  [key: string]: any;
}

/**
 * FilterOper Type Definition
 * Defines operators specifically for use in filter expressions that return boolean values.
 * Includes comparison, logical, and conditional operators suitable for filtering operations.
 */
const FILTER_OPERATORS = [
	'>', '<', '>=', '<=', 
	'==', '!=', '===', '!==', 
	'&&', '||', '!', '?',
	'includes', 'startsWith', 'endsWith',
] as const;

export type FilterOper = typeof FILTER_OPERATORS[number];

/**
 * Operator Type Definition
 * Defines all supported operators for use in expressions and computations.
 * Includes comparison, logical, arithmetic, bitwise, and conditional operators.
 * Note: For filtering operations, use FilterOper instead.
 */
const OPERATORS = [
	'>', '<', '>=', '<=', 
	'==', '!=', '===', '!==', 
	'&&', '||', 
	'+', '-', '*', '/', '%', 
	'^', '&', '|', '!', '~', 
	'<<', '>>', '>>>', 
	'?', 'includes', 'startsWith', 'endsWith',
] as const;

export type Operator = typeof OPERATORS[number];

/**
 * FilterCriteria Type Definition
 * This type is used to define filters that can be applied to arrays of items.
 * It allows for complex filtering operations using operators and can handle both static and dynamic values.
 * @template T - The type of items in the array.
 * @property leftOperand - The left operand of the filter condition, which can be a string (property name), a function, or a dynamic value.
 * @property operator - The filter operator to use for comparison - only boolean-returning operators are allowed.
 * @property rightOperand - The right operand of the filter condition, which can be a static value, a function, or a dynamic value.
 * */
export type FilterCriteria<T = any> = {
	leftOperand: string | ((item: T, index: number) => any);
	operator: FilterOper;
	rightOperand: any | ((item: T, index: number) => any);
};

/**
 * SortCriteria Type Definition
 * This type is used to define sorting operations for arrays of items.
 * It allows for both static and dynamic sorting based on properties or functions.
 * @template T - The type of items in the array.
 * @property sortBy - The property name or function to sort by.
 * @property direction - The direction of sorting, either 'asc' for ascending or 'desc' for descending.
 */
export type SortCriteria<T = any> = {
	sortBy: string | ((item: T) => any);
	direction?: 'asc' | 'desc';
};

export type * from 'array';
export type * from 'array-buffer';
export type * from 'blob';
export type * from 'cookie';
export type * from 'form-data';
export type * from 'indexed-db';
export type * from 'indexed-db-request';
export type * from 'readable-stream';
export type * from 'request';
export type * from 'url-search-params';
export type * from 'web-socket';
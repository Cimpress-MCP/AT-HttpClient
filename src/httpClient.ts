/* eslint-disable no-console, no-param-reassign */

import axios, { AxiosAdapter, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import * as uuid from 'uuid';
import cacheAdapterEnhancer, {
  Options as CacheOptions,
} from 'axios-extensions/lib/cacheAdapterEnhancer';
import retryAdapterEnhancer, {
  Options as RetryOptions,
} from 'axios-extensions/lib/retryAdapterEnhancer';

const invalidToken: string = 'Invalid token';
let requestId: string = '';

export default class HttpClient {
  private readonly logFunction: (...msg: any) => void;

  private readonly tokenResolverFunction?: () => Promise<string>;

  private readonly client: AxiosInstance;

  private readonly enableRetry: boolean;

  private readonly enableCache: boolean;

  /**
   * Create a new Instance of the HttpClient
   */
  constructor(options?: HttpClientOptions) {
    this.logFunction = options?.logFunction ?? console.log;
    this.tokenResolverFunction = options?.tokenResolver;
    this.enableCache = options?.enableCache ?? false;
    this.enableRetry = options?.enableRetry ?? false;
    this.client =
      options?.client ??
      axios.create({
        adapter: (() => {
          let adapters = axios.defaults.adapter as AxiosAdapter;
          if (this.enableCache) {
            adapters = cacheAdapterEnhancer(adapters, options?.cacheOptions);
          }
          if (this.enableRetry) {
            adapters = retryAdapterEnhancer(adapters, options?.retryOptions);
          }
          return adapters;
        })(),
      });

    this.client.interceptors.request.use(
      (config) => {
        requestId = uuid.v4();
        this.logFunction(
          {
            title: 'HTTP Request',
            level: 'INFO',
            requestId,
            method: config.method,
            url: config.url,
          },
          false,
        );

        if (!config.url) {
          throw new Error('HttpClient Error: "url" must be defined');
        }
        return config;
      },
      (error) => {
        this.logFunction({
          title: 'HTTP Request Error',
          level: 'WARN',
          requestId: error?.config?.requestId ?? error?.request?.config?.requestId,
          exception: error,
        });

        throw new Error(error.message);
      },
    );

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        const errorRequestId =
          (error && error.config && error.config.requestId) ||
          (error.request && error.request.config && error.request.config.requestId);

        if (error.message === invalidToken) {
          this.logFunction({
            title: 'HTTP call skipped due to a token error',
            level: 'INFO',
            requestId: errorRequestId,
            exception: error,
          });
        } else {
          this.logFunction({
            title: 'HTTP Response Error',
            level: 'INFO',
            requestId: errorRequestId,
            exception: error,
          });
        }

        throw new Error(error.message);
      },
    );
  }

  /**
   * Resolves the token with the token provider and adds it to the headers
   */
  async createHeadersWithResolvedToken(
    headers: Record<string, string> = {},
  ): Promise<Record<string, string>> {
    if (this.tokenResolverFunction) {
      if (headers.Authorization) {
        throw new Error(
          'Authorization header already specified, please create a new HttpClient with a different (or without a) tokenResolver',
        );
      } else {
        const token = await this.tokenResolverFunction();
        return {
          ...headers,
          Authorization: `Bearer ${token}`,
        };
      }
    }

    return headers;
  }

  /**
   * Get from the given url. Bearer token is automatically injected if tokenResolverFunction was provided to the constructor.
   */
  async get<T = any>(
    url: string,
    config: AxiosRequestConfig = { responseType: 'json' },
  ): Promise<AxiosResponse<T>> {
    return this.client.get<T>(url, {
      responseType: 'json',
      ...config,
      headers: await this.createHeadersWithResolvedToken(config.headers),
    });
  }

  /**
   * Post data to the given url. Bearer token is automatically injected if tokenResolverFunction was provided to the constructor.
   */
  async post<T = any>(
    url: string,
    data: any,
    config: AxiosRequestConfig = {},
  ): Promise<AxiosResponse<T>> {
    config.headers = await this.createHeadersWithResolvedToken(config.headers);
    return this.client.post<T>(url, data, config);
  }

  /**
   * Put data to the given url. Bearer token is automatically injected if tokenResolverFunction was provided to the constructor.
   */
  async put<T = any>(
    url: string,
    data: any,
    config: AxiosRequestConfig = {},
  ): Promise<AxiosResponse<T>> {
    config.headers = await this.createHeadersWithResolvedToken(config.headers);
    return this.client.put<T>(url, data, config);
  }

  /**
   * Patch data on the given url. Bearer token is automatically injected if tokenResolverFunction was provided to the constructor.
   */
  async patch<T = any>(
    url: string,
    data: any,
    config: AxiosRequestConfig = {},
  ): Promise<AxiosResponse<T>> {
    config.headers = await this.createHeadersWithResolvedToken(config.headers);
    return this.client.patch<T>(url, data, config);
  }

  /**
   * Delete the resource on the given url. Bearer token is automatically injected if tokenResolverFunction was provided to the constructor.
   */
  async delete<T = any>(url: string, config: AxiosRequestConfig = {}): Promise<AxiosResponse<T>> {
    config.headers = await this.createHeadersWithResolvedToken(config.headers);
    return this.client.delete<T>(url, config);
  }

  /**
   * Makes a head call to the provided url. Bearer token is automatically injected if tokenResolverFunction was provided to the constructor.
   */
  async head<T = any>(url: string, config: AxiosRequestConfig = {}): Promise<AxiosResponse<T>> {
    config.headers = await this.createHeadersWithResolvedToken(config.headers);
    return this.client.head<T>(url, config);
  }

  /**
   * Makes an options call to the provided url. Bearer token is automatically injected if tokenResolverFunction was provided to the constructor.
   */
  async options<T = any>(url: string, config: AxiosRequestConfig = {}): Promise<AxiosResponse<T>> {
    config.headers = await this.createHeadersWithResolvedToken(config.headers);
    return this.client.options<T>(url, config);
  }
}

export interface HttpClientOptions {
  /**
   * An Axios Instance (disables caching and retrying)
   */
  client?: AxiosInstance;
  /**
   * A function that returns a bearer token
   */
  tokenResolver?: () => Promise<string>;
  /**
   * Logger function
   */
  logFunction?: (...msg) => void;
  /**
   * enable caching (false by default)
   */
  enableCache?: boolean;
  /**
   * Cache options
   * @link https://github.com/kuitos/axios-extensions#cacheadapterenhancer
   */
  cacheOptions?: CacheOptions;
  /**
   * Enable automatic retries
   */
  enableRetry?: boolean;
  /**
   * Retry options
   * @link https://github.com/kuitos/axios-extensions#cacheadapterenhancer
   */
  retryOptions?: RetryOptions;
}

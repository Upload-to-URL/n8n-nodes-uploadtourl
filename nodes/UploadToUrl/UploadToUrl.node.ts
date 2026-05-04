import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeApiError, NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

export class UploadToUrl implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Upload to URL',
		name: 'uploadToUrl',
		icon: 'file:upload-to-url.svg',
		group: ['output'],
		version: 1,
		subtitle: '={{$parameter["operation"].charAt(0).toUpperCase() + $parameter["operation"].slice(1) + " File"}}',
		description: 'Upload files for instant hosting and receive a shareable public URL. Delete anytime',
		defaults: {
			name: 'Upload to URL',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		credentials: [
			{
				name: 'uploadToUrlApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'File',
						value: 'fileActions',
					},
				],
				default: 'fileActions',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['fileActions'],
					},
				},
				options: [
					{
						name: 'Delete File',
						value: 'delete',
						description: 'Delete a file by file ID',
						action: 'Delete a File',
					},
					{
						name: 'Download File',
						value: 'download',
						description: 'Download a file from a public URL',
						action: 'Download a File',
					},
					{
						name: 'Retrieve File',
						value: 'retrieve',
						description: 'Retrieve file information by file ID',
						action: 'Retrieve a File',
					},
					{
						name: 'Upload File',
						value: 'upload',
						description: 'Upload a file (binary data or base64) and get a public URL',
						action: 'Upload a File',
					},
					{
						name: 'Upload File from URL',
						value: 'uploadFileFromUrl',
						description: 'Fetch a file from a public URL and host it',
						action: 'Upload a File from URL',
					},
					{
						name: 'Upload Multiple Files',
						value: 'uploadMultiple',
						description: 'Upload multiple binary files and get their public URLs',
						action: 'Upload Multiple Files',
					},
				],
				default: 'upload',
			},
			// ---- File ID for Retrieve ----
			{
				displayName: 'File ID',
				name: 'fileId',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['retrieve'],
					},
				},
				description: 'The ID of the file to retrieve',
			},
			// ---- File ID for Delete ----
			{
				displayName: 'File ID',
				name: 'fileId',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['delete'],
					},
				},
				description: 'The ID of the file to delete',
			},
			// ---- Upload-specific parameters ----
			{
				displayName: 'Input Type',
				name: 'inputType',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Binary Data',
						value: 'binary',
						description: 'Use binary data from previous nodes',
					},
					{
						name: 'Base64 String',
						value: 'base64',
						description: 'Use base64 encoded string',
					},
				],
				default: 'binary',
				displayOptions: {
					show: {
						operation: ['upload'],
					},
				},
			},
			{
				displayName: 'Upload All Binary Data',
				name: 'uploadAllBinary',
				type: 'boolean',
				default: true,
				displayOptions: {
					show: {
						operation: ['upload'],
						inputType: ['binary'],
					},
				},
				description: 'Whether to automatically upload every binary property found in the item',
			},
			{
				displayName: 'Binary Property',
				name: 'binaryPropertyName',
				type: 'string',
				default: 'data',
				displayOptions: {
					show: {
						operation: ['upload'],
						inputType: ['binary'],
						uploadAllBinary: [false],
					},
				},
				required: true,
				description: 'Name of the binary property containing the file to upload',
			},
			// ---- Multiple Upload Parameters ----
			{
				displayName: 'Selection Mode',
				name: 'selectionMode',
				type: 'options',
				options: [
					{
						name: 'All Binary Data',
						value: 'all',
						description: 'Automatically upload every binary property found in the item',
					},
					{
						name: 'Specific Names',
						value: 'names',
						description: 'Specify a list of binary property names to upload',
					},
					{
						name: 'Regex Pattern',
						value: 'regex',
						description: 'Match binary property names using a regular expression',
					},
				],
				default: 'all',
				displayOptions: {
					show: {
						operation: ['uploadMultiple'],
					},
				},
				description: 'How to select which binary properties to upload',
			},
			{
				displayName: 'Binary Property Names',
				name: 'binaryPropertyNames',
				type: 'fixedCollection',
				placeholder: 'Add Property',
				typeOptions: {
					multipleValues: true,
				},
				displayOptions: {
					show: {
						operation: ['uploadMultiple'],
						selectionMode: ['names'],
					},
				},
				default: {},
				options: [
					{
						name: 'propertyList',
						displayName: 'Property',
						values: [
							{
								displayName: 'Property Name',
								name: 'name',
								type: 'string',
								default: 'data',
								description: 'Name of the binary property to upload',
							},
						],
					},
				],
			},
			{
				displayName: 'Property Name Regex',
				name: 'propertyNameRegex',
				type: 'string',
				default: '',
				placeholder: 'e.g. ^attachment_.*',
				displayOptions: {
					show: {
						operation: ['uploadMultiple'],
						selectionMode: ['regex'],
					},
				},
				required: true,
				description: 'Regular expression to match binary property names',
			},
			{
				displayName: 'File URL',
				name: 'fileUrl',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['uploadFileFromUrl', 'download'],
					},
				},
				placeholder: 'https://example.com/image.jpg',
				description: 'The public URL of the file to fetch',
			},
			{
				displayName: 'Put Output In Field',
				name: 'dataPropertyName',
				type: 'string',
				default: 'data',
				required: true,
				displayOptions: {
					show: {
						operation: ['download'],
					},
				},
				description: 'The name of the binary property where the file should be stored',
			},
			{
				displayName: 'Base64 Data',
				name: 'base64Data',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: ['upload'],
						inputType: ['base64'],
					},
				},
				required: true,
				description: 'Base64 encoded file data',
			},
			{
				displayName: 'Filename',
				name: 'fileName',
				type: 'string',
				default: 'file.bin',
				displayOptions: {
					show: {
						operation: ['upload'],
						inputType: ['base64'],
					},
				},
				required: true,
				description: 'Name of the file (e.g., document.pdf, image.jpg)',
			},
			{
				displayName: 'MIME Type',
				name: 'mimeType',
				type: 'options',
				default: 'auto',
				displayOptions: {
					show: {
						operation: ['upload'],
						inputType: ['base64'],
					},
				},
				options: [
					{
						name: 'Auto-Detect From Filename',
						value: 'auto',
						description: 'Automatically detect MIME type from file extension',
					},
					{
						name: 'CSV File',
						value: 'text/csv',
					},
					{
						name: 'Custom',
						value: 'custom',
						description: 'Specify a custom MIME type',
					},
					{
						name: 'GIF Image',
						value: 'image/gif',
					},
					{
						name: 'JPEG Image',
						value: 'image/jpeg',
					},
					{
						name: 'JSON File',
						value: 'application/json',
					},
					{
						name: 'MP3 Audio',
						value: 'audio/mpeg',
					},
					{
						name: 'MP4 Video',
						value: 'video/mp4',
					},
					{
						name: 'PDF Document',
						value: 'application/pdf',
					},
					{
						name: 'PNG Image',
						value: 'image/png',
					},
					{
						name: 'SVG Image',
						value: 'image/svg+xml',
					},
					{
						name: 'Text File',
						value: 'text/plain',
					},
					{
						name: 'WebP Image',
						value: 'image/webp',
					},
					{
						name: 'XML File',
						value: 'application/xml',
					},
					{
						name: 'ZIP Archive',
						value: 'application/zip',
					},
				],
				required: true,
				description: 'MIME type of the file',
			},
			{
				displayName: 'Custom MIME Type',
				name: 'customMimeType',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: ['upload'],
						inputType: ['base64'],
						mimeType: ['custom'],
					},
				},
				required: true,
				description: 'Enter a custom MIME type (e.g., application/vnd.ms-excel)',
			},
			// ---- Expiry Options (for Upload) ----
			{
				displayName: 'Expiry',
				name: 'expiryType',
				type: 'options',
				default: '7',
				description: 'How long the file should be available on the server',
				displayOptions: {
					show: {
						operation: ['upload', 'uploadMultiple', 'uploadFileFromUrl'],
					},
				},
				options: [
					{
						name: '1 Day',
						value: '1',
						description: 'File expires after 1 day',
					},
					{
						name: '7 Days',
						value: '7',
						description: 'File expires after 7 days',
					},
					{
						name: '15 Days',
						value: '15',
						description: 'File expires after 15 days',
					},
					{
						name: '30 Days',
						value: '30',
						description: 'File expires after 30 days',
					},
					{
						name: 'Never',
						value: 'never',
						description: 'File will never expire',
					},
					{
						name: 'Custom',
						value: 'custom',
						description: 'Set a custom number of days before the file expires',
					},
				],
			},
			{
				displayName: 'Expiry Days',
				name: 'expiryDays',
				type: 'number',
				default: 30,
				typeOptions: {
					minValue: 1,
				},
				description: 'Number of days the file should remain available',
				displayOptions: {
					show: {
						operation: ['upload', 'uploadMultiple', 'uploadFileFromUrl'],
						expiryType: ['custom'],
					},
				},
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const operation = this.getNodeParameter('operation', i) as string;

				if (operation === 'retrieve') {
					const fileId = this.getNodeParameter('fileId', i) as string;
					const response = await this.helpers.httpRequestWithAuthentication.call(
						this,
						'uploadToUrlApi',
						{
							method: 'GET',
							url: `https://uploadtourl.com/api/file/${fileId}`,
						},
					);
					returnData.push({
						json: typeof response === 'string' ? JSON.parse(response) : response,
						pairedItem: i,
					});
				} else if (operation === 'delete') {
					const fileId = this.getNodeParameter('fileId', i) as string;
					const response = await this.helpers.httpRequestWithAuthentication.call(
						this,
						'uploadToUrlApi',
						{
							method: 'DELETE',
							url: `https://uploadtourl.com/api/file/${fileId}`,
						},
					);
					returnData.push({
						json: typeof response === 'string' ? JSON.parse(response) : response,
						pairedItem: i,
					});
				} else if (operation === 'download') {
					const fileUrl = this.getNodeParameter('fileUrl', i) as string;
					const dataPropertyName = this.getNodeParameter('dataPropertyName', i) as string;

					const response = await this.helpers.httpRequest({
						method: 'GET',
						url: fileUrl,
						encoding: 'arraybuffer',
						returnFullResponse: true,
					});

					const binaryDataBuffer = Buffer.from(response.body || response.data);
					const { fileName, contentType } = extractMetadata(response.headers, fileUrl);

					const binaryData = await this.helpers.prepareBinaryData(
						binaryDataBuffer,
						fileName,
						contentType,
					);

					returnData.push({
						json: items[i].json,
						binary: {
							[dataPropertyName]: binaryData,
						},
						pairedItem: i,
					});
				} else if (
					operation === 'upload' ||
					operation === 'uploadMultiple' ||
					operation === 'uploadFileFromUrl'
				) {
					// Determine expiry_days value
					const expiryType = this.getNodeParameter('expiryType', i, '7') as string;
					let expiryDaysValue: string | number = 'never';
					if (expiryType === 'never') {
						expiryDaysValue = 'never';
					} else if (expiryType === 'custom') {
						expiryDaysValue = this.getNodeParameter('expiryDays', i, 30) as number;
					} else {
						expiryDaysValue = parseInt(expiryType, 10);
					}

					if (operation === 'uploadFileFromUrl') {
						const fileUrl = this.getNodeParameter('fileUrl', i) as string;

						// Fetch remote file
						const response = await this.helpers.httpRequest({
							method: 'GET',
							url: fileUrl,
							encoding: 'arraybuffer',
							returnFullResponse: true,
						});

						const binaryDataBuffer = Buffer.from(response.body || response.data);
						const { fileName, contentType } = extractMetadata(response.headers, fileUrl);

						const uploadResponse = await performUpload.call(
							this,
							binaryDataBuffer,
							fileName,
							contentType,
							expiryDaysValue,
						);

						returnData.push({
							json:
								typeof uploadResponse === 'string'
									? JSON.parse(uploadResponse)
									: uploadResponse,
							pairedItem: i,
						});
					} else if (operation === 'upload') {
						const inputType = this.getNodeParameter('inputType', i) as string;

						if (inputType === 'binary') {
							const uploadAllBinary = this.getNodeParameter('uploadAllBinary', i, true) as boolean;
							
							const itemBinaryData = items[i].binary;
							if (!itemBinaryData) {
								throw new NodeOperationError(this.getNode(), 'No binary data found in item', {
									itemIndex: i,
								});
							}

							let propertyNames: string[] = [];
							if (uploadAllBinary) {
								propertyNames = Object.keys(itemBinaryData);
							} else {
								propertyNames = [this.getNodeParameter('binaryPropertyName', i) as string];
							}

							if (propertyNames.length === 0) {
								returnData.push({
									json: { message: 'No binary properties found' },
									pairedItem: i,
								});
								continue;
							}

							const uploadResults = [];
							for (const propertyName of propertyNames) {
								try {
									const binaryDataVal = itemBinaryData[propertyName];
									if (!binaryDataVal) {
										if (!uploadAllBinary) {
											throw new NodeOperationError(this.getNode(), `Binary property ${propertyName} not found`);
										}
										continue;
									}

									const binaryFiles = Array.isArray(binaryDataVal) ? binaryDataVal : [binaryDataVal];
									const isStandardSingle = !Array.isArray(binaryDataVal);

									for (let j = 0; j < binaryFiles.length; j++) {
										const binaryData = binaryFiles[j];
										const fileName = binaryData.fileName ?? (binaryFiles.length > 1 ? `file_${j}` : 'file');
										const contentType = binaryData.mimeType || 'application/octet-stream';
										let binaryDataBuffer: Buffer;

										if (isStandardSingle) {
											binaryDataBuffer = await this.helpers.getBinaryDataBuffer(i, propertyName);
										} else {
											if (binaryData.data && typeof binaryData.data === 'string') {
												binaryDataBuffer = Buffer.from(binaryData.data, 'base64');
											} else if (binaryData.data && Buffer.isBuffer(binaryData.data)) {
												binaryDataBuffer = binaryData.data;
											} else {
												binaryDataBuffer = await this.helpers.getBinaryDataBuffer(i, propertyName);
											}
										}

										const response = await performUpload.call(
											this,
											binaryDataBuffer,
											fileName,
											contentType,
											expiryDaysValue,
										);
										
										uploadResults.push({
											property: propertyName,
											fileName,
											data: typeof response === 'string' ? JSON.parse(response) : response,
										});
									}
								} catch (error) {
									// Let upload errors reach the existing outer catch
									throw error;
								}
							}

							if (uploadResults.length === 1) {
								returnData.push({
									json: uploadResults[0].data,
									pairedItem: i,
								});
							} else {
								returnData.push({
									json: { results: uploadResults },
									pairedItem: i,
								});
							}
						} else {
							let binaryDataBuffer: Buffer;
							let fileName: string;
							let contentType: string;

							const base64Data = this.getNodeParameter('base64Data', i) as string;
							fileName = this.getNodeParameter('fileName', i) as string;
							const mimeTypeValue = this.getNodeParameter('mimeType', i) as string;

							if (mimeTypeValue === 'auto') {
								const ext = fileName.split('.').pop()?.toLowerCase();
								const mimeMap: { [key: string]: string } = {
									jpg: 'image/jpeg',
									jpeg: 'image/jpeg',
									png: 'image/png',
									gif: 'image/gif',
									webp: 'image/webp',
									svg: 'image/svg+xml',
									pdf: 'application/pdf',
									txt: 'text/plain',
									csv: 'text/csv',
									json: 'application/json',
									xml: 'application/xml',
									zip: 'application/zip',
									mp4: 'video/mp4',
									mp3: 'audio/mpeg',
								};
								contentType = mimeMap[ext || ''] || 'application/octet-stream';
							} else if (mimeTypeValue === 'custom') {
								contentType = this.getNodeParameter('customMimeType', i) as string;
							} else {
								contentType = mimeTypeValue;
							}

							const cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, '');
							binaryDataBuffer = Buffer.from(cleanBase64, 'base64');

							const uploadResponse = await performUpload.call(
								this,
								binaryDataBuffer,
								fileName,
								contentType,
								expiryDaysValue,
							);
							
							returnData.push({
								json: typeof uploadResponse === 'string' ? JSON.parse(uploadResponse) : uploadResponse,
								pairedItem: i,
							});
						}
					} else {
						// uploadMultiple
						const selectionMode = this.getNodeParameter('selectionMode', i) as string;
						let propertyNames: string[] = [];

						const itemBinaryData = items[i].binary;
						if (!itemBinaryData) {
							throw new NodeOperationError(this.getNode(), 'No binary data found in item', {
								itemIndex: i,
							});
						}

						if (selectionMode === 'all') {
							propertyNames = Object.keys(itemBinaryData);
						} else if (selectionMode === 'names') {
							const propertyList = this.getNodeParameter(
								'binaryPropertyNames.propertyList',
								i,
								[],
							) as Array<{ name: string }>;
							propertyNames = propertyList.map((p) => p.name);
						} else if (selectionMode === 'regex') {
							const pattern = this.getNodeParameter('propertyNameRegex', i) as string;
							const regex = new RegExp(pattern);
							propertyNames = Object.keys(itemBinaryData).filter((name) => regex.test(name));
						}

						if (propertyNames.length === 0) {
							returnData.push({
								json: { message: 'No binary properties matched the selection criteria' },
								pairedItem: i,
							});
							continue;
						}

						const uploadResults = [];
						for (const propertyName of propertyNames) {
							try {
								const binaryDataVal = itemBinaryData[propertyName];
								if (!binaryDataVal) continue;

								const binaryFiles = Array.isArray(binaryDataVal) ? binaryDataVal : [binaryDataVal];
								const isStandardSingle = !Array.isArray(binaryDataVal);

								for (let j = 0; j < binaryFiles.length; j++) {
									const binaryData = binaryFiles[j];
									const fileName = binaryData.fileName ?? (binaryFiles.length > 1 ? `file_${j}` : 'file');
									const contentType = binaryData.mimeType || 'application/octet-stream';
									let binaryDataBuffer: Buffer;

									if (isStandardSingle) {
										// Standard n8n property: use helper for external storage support
										binaryDataBuffer = await this.helpers.getBinaryDataBuffer(i, propertyName);
									} else {
										// Custom array of files (e.g. from Code node): use internal data
										if (binaryData.data && typeof binaryData.data === 'string') {
											binaryDataBuffer = Buffer.from(binaryData.data, 'base64');
										} else if (binaryData.data && Buffer.isBuffer(binaryData.data)) {
											binaryDataBuffer = binaryData.data;
										} else {
											// Fallback for cases where data might be missing but property is valid
											binaryDataBuffer = await this.helpers.getBinaryDataBuffer(i, propertyName);
										}
									}

									const response = await performUpload.call(
										this,
										binaryDataBuffer,
										fileName,
										contentType,
										expiryDaysValue,
									);
									uploadResults.push({
										property: propertyName,
										fileName,
										data:
											typeof response === 'string' ? JSON.parse(response) : response,
									});
								}
							} catch (error) {
								// Let upload errors reach the existing outer catch
								throw error;
							}
						}

						returnData.push({
							json: { results: uploadResults },
							pairedItem: i,
						});
					}
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
						pairedItem: i,
					});
					continue;
				}

				const errorResponse = (error as any).response;
				if (errorResponse) {
					throw new NodeApiError(this.getNode(), errorResponse, {
						itemIndex: i,
					});
				}

				throw new NodeOperationError(this.getNode(), error as Error, { itemIndex: i });
			}
		}

		return [returnData];
	}
}

async function performUpload(
	this: IExecuteFunctions,
	binaryDataBuffer: Buffer,
	fileName: string,
	contentType: string,
	expiryDaysValue: string | number,
): Promise<any> {
	const boundary = '----n8nFormBoundary' + Math.random().toString(36).substring(2);

	const filePart = Buffer.from(
		`--${boundary}\r\n` +
			`Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n` +
			`Content-Type: ${contentType}\r\n\r\n`,
	);
	const expiryPart = Buffer.from(
		`\r\n--${boundary}\r\n` +
			`Content-Disposition: form-data; name="expiry_days"\r\n\r\n` +
			`${expiryDaysValue}`,
	);
	const sourcePart = Buffer.from(
		`\r\n--${boundary}\r\n` +
			`Content-Disposition: form-data; name="source"\r\n\r\n` +
			`n8n`,
	);
	const footer = Buffer.from(`\r\n--${boundary}--\r\n`);
	const body = Buffer.concat([filePart, binaryDataBuffer, expiryPart, sourcePart, footer]);

	return await this.helpers.httpRequestWithAuthentication.call(this, 'uploadToUrlApi', {
		method: 'POST',
		url: 'https://uploadtourl.com/api/upload',
		body,
		headers: {
			'Content-Type': `multipart/form-data; boundary=${boundary}`,
		},
	});
}

function extractMetadata(
	headers: { [key: string]: any },
	fileUrl: string,
): { fileName: string; contentType: string } {
	let fileName = 'file';
	let contentType = 'application/octet-stream';

	if (headers['content-type']) {
		contentType = (headers['content-type'] as string).split(';')[0];
	}

	if (headers['content-disposition']) {
		const contentDisposition = headers['content-disposition'] as string;
		const filenameMatch = contentDisposition.match(/filename(?:\*)=(?:[^\']+\'\')?\"?([^\";]+)\"?/);
		if (filenameMatch) {
			fileName = filenameMatch[1];
		}
	}

	if (fileName === 'file') {
		try {
			const urlPath = new URL(fileUrl).pathname;
			const filenameFromUrl = urlPath.split('/').pop();
			if (filenameFromUrl && filenameFromUrl.includes('.')) {
				fileName = filenameFromUrl;
			}
		} catch {
			/* URL parsing failed — use default filename */
		}
	}

	return { fileName, contentType };
}

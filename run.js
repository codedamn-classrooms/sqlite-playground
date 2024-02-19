import Database from 'better-sqlite3'
import fs from 'fs'
import clc from 'cli-color'
import Table from 'cli-table'

const grayLog = (data) => console.log(clc.xterm(8)(data))
const redLog = (data) => console.log(clc.xterm(9)(data))

const databasePath = fs
	.readdirSync('.')
	.find((file) => file.endsWith('.db') || file.endsWith('.sqlite'))

const queryFilePath = fs.readdirSync('.').find((file) => file.endsWith('.sql'))

if (!databasePath) {
	console.error(
		'No database file found in project root directory. Create a database.sqlite file in the project root directory'
	)
	process.exit(1)
}

if (!queryFilePath) {
	console.error(
		'No query file path found. Create a query.sql file in the project root directory.'
	)
	process.exit(1)
}

const db = new Database(databasePath)

const executeAndLogQuery = (query) => {
	try {
		if (query.trim().toUpperCase().startsWith('SELECT')) {
			const stmt = db.prepare(query)

			const rows = stmt.all()

			if (rows.length === 0) {
				console.log('No result found')
			} else {
				const table = new Table({
					head: Object.keys(rows[0]),
				})

				for (const row of rows) {
					const rowData = Object.entries(row).map(([col, value]) =>
						value == null ? clc.red('NULL') : value
					)
					table.push(rowData)
				}

				console.log(table.toString())
			}
		} else {
			console.log(db.prepare(query).run())
		}
	} catch (err) {
		redLog(err.message)
	}
}

const executeSqlFile = (filePath) => {
	const sqlContent = fs.readFileSync(filePath, 'utf-8')
	let accumulatedQuery = ''

	const queries = sqlContent.split('\n')

	for (const line of queries) {
		// Remove comments
		const cleanedLine = line.split('--')[0].trim()
		// Accumulate lines for a complete SQL statement
		if (cleanedLine) {
			accumulatedQuery += cleanedLine + ' '
		}

		// Execute when a complete SQL statement is accumulated
		if (cleanedLine.endsWith(';')) {
			grayLog(`Executing query: "${accumulatedQuery}"\n`)
			executeAndLogQuery(accumulatedQuery)
			accumulatedQuery = ''
			grayLog(`Query execution complete\n`)
		}
	}

	if (accumulatedQuery.trim()) {
		grayLog(`Executing query: "${accumulatedQuery}"\n`)
		executeAndLogQuery(accumulatedQuery)
		accumulatedQuery = ''
		grayLog(`\nQuery execution complete\n`)
	}
}

// Execute SQL file and collect results
executeSqlFile(queryFilePath)

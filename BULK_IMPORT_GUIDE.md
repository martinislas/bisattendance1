# Student Bulk Import Guide

## Overview
The Student Management system supports bulk importing of students via CSV files. This guide explains the CSV format and how to use the import feature.

## CSV File Format

### Required Columns
Your CSV file must include these columns (in any order):
- **name**: Student's full name (required)
- **sex**: Student's gender - accepted values: `Male`, `Female`, `M`, `F` (required)
- **year**: Student's year/grade (required)
  - Accepted formats: `EY`, `Year 1` through `Year 13`, or numbers `1` through `13`

### Optional Columns
- **studentId**: Unique identifier for the student
- **email**: Student's email address
- **phone**: Contact phone number
- **address**: Physical address
- **dateOfBirth**: Date of birth (various formats accepted)

### Column Name Variations
The system recognizes various column name variations:
- **Name**: `name`, `student name`, `full name`
- **Sex/Gender**: `sex`, `gender`
- **Year**: `year`, `grade`, `class`, `level`
- **Student ID**: `studentId`, `student id`, `student_id`, `id`, `number`
- **Email**: `email`, `e-mail`
- **Phone**: `phone`, `phone number`, `contact`
- **Date of Birth**: `dob`, `date of birth`, `dateofbirth`, `birth date`

## Example CSV Files

### Basic Example (Required Fields Only)
```csv
name,sex,year
John Smith,Male,Year 7
Jane Doe,Female,8
Michael Johnson,M,9
Sarah Williams,F,Year 10
```

### Complete Example (With Optional Fields)
```csv
name,sex,year,studentId,email,phone,address,dateOfBirth
John Smith,Male,Year 7,STU001,john.smith@example.com,555-0101,123 Main St,2010-05-15
Jane Doe,Female,Year 8,STU002,jane.doe@example.com,555-0102,456 Oak Ave,2009-08-22
Michael Johnson,M,9,STU003,,,
Sarah Williams,F,Year 10,,,555-0104,,
David Brown,Male,EY,STU005,,,,2016-03-10
```

### With Quoted Fields (for names/addresses with commas)
```csv
name,sex,year,address
"Smith, John",Male,Year 7,"123 Main St, Apt 4B"
"Doe, Jane",Female,Year 8,"456 Oak Ave, Unit 2"
```

## Year Format Guidelines
- **Early Years**: `EY` or `Early Years`
- **Primary/Secondary**: `Year 1`, `Year 2`, ... `Year 13`
- **Numeric Format**: You can also use just numbers `1`, `2`, ... `13` (will be converted to `Year 1`, etc.)

## Gender Format Guidelines
Accepted values for the sex/gender field:
- **Male**: `Male`, `M`, `MALE`, `Boy`, `BOY`
- **Female**: `Female`, `F`, `FEMALE`, `Girl`, `GIRL`

## How to Import

1. **Prepare Your CSV File**
   - Ensure it has the required columns: name, sex, year
   - Make sure data is properly formatted
   - Save the file with `.csv` extension

2. **Navigate to Student Management**
   - Go to the Student Management page in the application

3. **Click "Import Students"**
   - Click the "Import Students" button
   - Select your CSV file
   - Wait for the upload and processing

4. **Review Import Results**
   - The system will show how many students were imported successfully
   - Any errors or duplicate students will be displayed
   - Students with duplicate Student IDs will be skipped

## Error Handling

### Common Errors and Solutions

1. **"No valid students found"**
   - Check that your CSV has the required columns: name, sex, year
   - Verify column names match the accepted variations

2. **"Invalid sex value"**
   - Ensure sex/gender values are: Male, Female, M, or F
   - Check for extra spaces or typos

3. **"Invalid year value"**
   - Use valid year formats: EY, Year 1-13, or numbers 1-13
   - Check for typos in year names

4. **"Student ID already exists"**
   - The student ID must be unique
   - Students with duplicate IDs will be skipped
   - Remove or change duplicate IDs in your CSV

5. **"Missing required field"**
   - Ensure every row has values for name, sex, and year
   - Empty rows or rows missing required fields will be skipped

### Partial Import Success
- The system uses "unordered" bulk insert mode
- Valid students will be imported even if some rows have errors
- A summary will show:
  - Number of students successfully imported
  - Number of rows with validation errors
  - Number of duplicate students skipped
  - Specific error messages for failed rows

## Best Practices

1. **Start Small**: Test with a small CSV file (5-10 students) first
2. **Validate Data**: Review your CSV in a spreadsheet program before importing
3. **Unique IDs**: If using student IDs, ensure they're unique across your database
4. **Consistent Formatting**: Use consistent capitalization and formats throughout
5. **Use Template**: Use the provided `student-import-template.csv` as a starting point

## Sample Template
A sample CSV template is provided in the root directory: `student-import-template.csv`

## Technical Notes

- Maximum file size: Depends on browser limitations (typically several MB)
- Supported file extensions: `.csv`
- Character encoding: UTF-8 recommended
- Handles quoted fields (CSV RFC 4180 compliant)
- Case-insensitive header matching
- Trims whitespace from all values
- Skips empty lines

## Need Help?
If you encounter issues not covered in this guide, check:
1. Browser console for detailed error messages
2. Network tab to see the exact server response
3. Ensure the backend server is running
4. Check that MongoDB is connected and accessible

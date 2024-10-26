# change-matrix
generate a matrix of directories with changes

## example
```
name: execute integration tasks

on:
  push:
    branches:
    - "**"

jobs:
  find-changed-dirs:
    runs-on: ubuntu-22.04
    name: generate-changed-dir-matrix
    outputs:
      directories: ${{ steps.check-changes.outputs.directories }}
    steps:
    - uses: actions/checkout@v4
      with:
        fetch-depth: 0
    - id: check-changes
      uses: hashibuto/actions/change-matrix@master
      with:
        exclude: .git*
        must-contain: VERSION

  publish:
    needs: find-changed-dirs
    runs-on: ubuntu-22.04
    if: needs.find-changed-dirs.outputs.directories != '[]'
    strategy:
      matrix:
        item: ${{ fromJson(needs.find-changed-dirs.outputs.directories) }}
    steps:
    - name: display info
      run: |
        echo ${{ matrix.item.name }}
        echo ${{ maxrix.item.path }}
```
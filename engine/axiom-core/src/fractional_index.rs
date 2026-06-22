//! Fractional indexing for node ordering.
//!
//! Inspired by Figma's approach: arbitrary-precision fractions
//! that allow insertion between any two existing positions
//! without rewriting other indices.

use serde::{Deserialize, Serialize};
use std::cmp::Ordering;

/// A fractional index represented as a base-95 encoded string.
/// Supports arbitrary precision — you can always insert between two indices.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FractionalIndex(String);

impl FractionalIndex {
    /// The initial index (middle of the range).
    pub fn initial() -> Self {
        Self("P".to_string()) // roughly middle of printable ASCII
    }

    /// Generate the next index after this one.
    pub fn next(&self) -> Self {
        let mut chars: Vec<u8> = self.0.bytes().collect();
        // Increment the last character
        if let Some(last) = chars.last_mut() {
            if *last < b'~' {
                *last += 1;
            } else {
                chars.push(b'P');
            }
        }
        Self(String::from_utf8(chars).unwrap_or_else(|_| "P".to_string()))
    }

    /// Generate an index between two existing indices.
    pub fn between(before: Option<&FractionalIndex>, after: Option<&FractionalIndex>) -> Self {
        match (before, after) {
            (None, None) => Self::initial(),
            (None, Some(a)) => {
                // Before the first element
                let mut chars: Vec<u8> = a.0.bytes().collect();
                if let Some(first) = chars.first_mut() {
                    if *first > b'!' {
                        *first -= 1;
                    } else {
                        chars.insert(0, b'P');
                    }
                }
                Self(String::from_utf8(chars).unwrap_or_else(|_| "P".to_string()))
            }
            (Some(b), None) => b.next(),
            (Some(b), Some(a)) => {
                // Between two elements — find midpoint
                let b_bytes: Vec<u8> = b.0.bytes().collect();
                let a_bytes: Vec<u8> = a.0.bytes().collect();
                let max_len = b_bytes.len().max(a_bytes.len()) + 1;

                let mut result = Vec::with_capacity(max_len);
                for i in 0..max_len {
                    let b_val = b_bytes.get(i).copied().unwrap_or(b'!') as u16;
                    let a_val = a_bytes.get(i).copied().unwrap_or(b'~') as u16;

                    if b_val + 1 < a_val {
                        result.push(((b_val + a_val) / 2) as u8);
                        break;
                    } else {
                        result.push(b_val as u8);
                    }
                }

                if result.is_empty() {
                    result.push(b'P');
                }

                Self(String::from_utf8(result).unwrap_or_else(|_| "P".to_string()))
            }
        }
    }
}

impl PartialEq for FractionalIndex {
    fn eq(&self, other: &Self) -> bool {
        self.0 == other.0
    }
}

impl Eq for FractionalIndex {}

impl PartialOrd for FractionalIndex {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}

impl Ord for FractionalIndex {
    fn cmp(&self, other: &Self) -> Ordering {
        self.0.cmp(&other.0)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn initial_index() {
        let idx = FractionalIndex::initial();
        assert!(!idx.0.is_empty());
    }

    #[test]
    fn next_index_is_greater() {
        let a = FractionalIndex::initial();
        let b = a.next();
        assert!(b > a);
    }

    #[test]
    fn between_two_indices() {
        let a = FractionalIndex::initial();
        let b = a.next();
        let mid = FractionalIndex::between(Some(&a), Some(&b));
        assert!(mid > a);
        assert!(mid < b);
    }

    #[test]
    fn before_first() {
        let a = FractionalIndex::initial();
        let before = FractionalIndex::between(None, Some(&a));
        assert!(before < a);
    }
}
